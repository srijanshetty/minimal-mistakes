package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/charmbracelet/log"
	"gopkg.in/yaml.v3"
)

// Post is a single piece of content from the site.
type Post struct {
	Title    string
	Date     time.Time
	Category string
	Tags     []string
	Excerpt  string
	Slug     string
	URL      string
	Body     string
}

// Store holds the current snapshot of site content and refreshes it from the
// git checkout, so SSH sessions always serve what the website serves.
type Store struct {
	siteDir string
	siteURL string

	mu    sync.RWMutex
	posts []Post
}

func NewStore(siteDir, siteURL string) *Store {
	return &Store{siteDir: siteDir, siteURL: siteURL}
}

func (s *Store) Posts() []Post {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.posts
}

// Reload re-reads every post from disk.
func (s *Store) Reload() error {
	posts, err := loadPosts(filepath.Join(s.siteDir, "_posts"), s.siteURL)
	if err != nil {
		return err
	}
	s.mu.Lock()
	s.posts = posts
	s.mu.Unlock()
	return nil
}

// Sync pulls the git checkout and reloads content on a fixed interval. A
// failed pull (offline, detached checkout, ...) is logged and the store keeps
// serving the previous snapshot; the disk reload still runs so local edits
// and external deploy scripts are picked up either way.
func (s *Store) Sync(interval time.Duration) {
	for {
		time.Sleep(interval)
		cmd := exec.Command("git", "-C", s.siteDir, "pull", "--ff-only", "--quiet")
		if out, err := cmd.CombinedOutput(); err != nil {
			log.Warn("git pull failed", "err", err, "output", strings.TrimSpace(string(out)))
		}
		if err := s.Reload(); err != nil {
			log.Warn("content reload failed", "err", err)
		}
	}
}

var (
	postNameRe     = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-(.+)\.(md|markdown)$`)
	highlightRe    = regexp.MustCompile(`\{%-?\s*highlight\s+(\w+)[^%]*-?%\}`)
	endHighlightRe = regexp.MustCompile(`\{%-?\s*endhighlight\s*-?%\}`)
	liquidTagRe    = regexp.MustCompile(`\{%-?[^%]*-?%\}`)
	liquidVarRe    = regexp.MustCompile(`\{\{-?[^}]*-?\}\}`)
	brRe           = regexp.MustCompile(`(?i)</?br\s*/?>`)
)

type frontMatter struct {
	Title      string   `yaml:"title"`
	Date       string   `yaml:"date"`
	Categories any      `yaml:"categories"`
	Tags       []string `yaml:"tags"`
	Excerpt    string   `yaml:"excerpt"`
}

func loadPosts(dir, siteURL string) ([]Post, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("reading %s: %w", dir, err)
	}

	var posts []Post
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		m := postNameRe.FindStringSubmatch(entry.Name())
		if m == nil {
			continue
		}
		post, err := loadPost(filepath.Join(dir, entry.Name()), m[1], m[2], siteURL)
		if err != nil {
			log.Warn("skipping post", "file", entry.Name(), "err", err)
			continue
		}
		posts = append(posts, post)
	}

	sort.Slice(posts, func(i, j int) bool { return posts[i].Date.After(posts[j].Date) })
	return posts, nil
}

func loadPost(path, fileDate, slug, siteURL string) (Post, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Post{}, err
	}

	fm, body, err := splitFrontMatter(string(raw))
	if err != nil {
		return Post{}, err
	}

	var meta frontMatter
	if err := yaml.Unmarshal([]byte(fm), &meta); err != nil {
		return Post{}, fmt.Errorf("front matter: %w", err)
	}

	post := Post{
		Title:    meta.Title,
		Tags:     meta.Tags,
		Excerpt:  strings.TrimSpace(meta.Excerpt),
		Slug:     slug,
		Category: firstCategory(meta.Categories),
		Date:     parseDate(meta.Date, fileDate),
		Body:     liquidToMarkdown(body),
	}
	if post.Title == "" {
		post.Title = strings.ReplaceAll(slug, "-", " ")
	}

	// Mirrors the site permalink: /:categories/:title/
	if post.Category != "" {
		post.URL = fmt.Sprintf("%s/%s/%s/", siteURL, post.Category, slug)
	} else {
		post.URL = fmt.Sprintf("%s/%s/", siteURL, slug)
	}
	return post, nil
}

func splitFrontMatter(raw string) (fm, body string, err error) {
	raw = strings.TrimPrefix(raw, "\uFEFF")
	if !strings.HasPrefix(raw, "---") {
		return "", raw, nil
	}
	parts := strings.SplitN(raw, "---", 3)
	if len(parts) < 3 {
		return "", "", fmt.Errorf("unterminated front matter")
	}
	return parts[1], parts[2], nil
}

func firstCategory(v any) string {
	switch c := v.(type) {
	case string:
		if f := strings.Fields(c); len(f) > 0 {
			return f[0]
		}
	case []any:
		if len(c) > 0 {
			if s, ok := c[0].(string); ok {
				return s
			}
		}
	}
	return ""
}

func parseDate(value, fileDate string) time.Time {
	formats := []string{
		time.RFC3339,
		"2006-01-02 15:04:05 -0700",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02",
	}
	value = strings.TrimSpace(value)
	for _, f := range formats {
		if t, err := time.Parse(f, value); err == nil {
			return t
		}
	}
	t, _ := time.Parse("2006-01-02", fileDate)
	return t
}

// liquidToMarkdown converts the Jekyll-era Liquid syntax that appears in the
// posts into plain markdown that glamour can render.
func liquidToMarkdown(body string) string {
	body = highlightRe.ReplaceAllString(body, "```$1")
	body = endHighlightRe.ReplaceAllString(body, "```")
	body = liquidTagRe.ReplaceAllString(body, "")
	body = liquidVarRe.ReplaceAllString(body, "")
	body = brRe.ReplaceAllString(body, "\n")
	return strings.TrimSpace(body)
}

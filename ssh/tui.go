package main

import (
	"fmt"

	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/lipgloss"
)

type viewState int

const (
	stateList viewState = iota
	stateReading
)

type postItem struct{ post Post }

func (i postItem) Title() string { return i.post.Title }

func (i postItem) Description() string {
	desc := i.post.Date.Format("Jan 2, 2006")
	if i.post.Category != "" {
		desc += "  ·  " + i.post.Category
	}
	if i.post.Excerpt != "" {
		desc += "  ·  " + i.post.Excerpt
	}
	return desc
}

func (i postItem) FilterValue() string {
	return i.post.Title + " " + i.post.Category + " " + i.post.Excerpt
}

type model struct {
	store    *Store
	renderer *lipgloss.Renderer

	state    viewState
	list     list.Model
	viewport viewport.Model
	current  Post

	width  int
	height int
	ready  bool

	titleStyle  lipgloss.Style
	footerStyle lipgloss.Style
}

func newModel(store *Store, renderer *lipgloss.Renderer) model {
	posts := store.Posts()
	items := make([]list.Item, len(posts))
	for i, p := range posts {
		items[i] = postItem{post: p}
	}

	delegate := list.NewDefaultDelegate()
	l := list.New(items, delegate, 0, 0)
	l.Title = fmt.Sprintf("srijanshetty.in — %d posts", len(posts))
	l.SetShowStatusBar(false)
	l.Styles.Title = renderer.NewStyle().
		Background(lipgloss.Color("62")).
		Foreground(lipgloss.Color("230")).
		Padding(0, 1)

	return model{
		store:    store,
		renderer: renderer,
		state:    stateList,
		list:     l,
		titleStyle: renderer.NewStyle().
			Foreground(lipgloss.Color("230")).
			Background(lipgloss.Color("62")).
			Padding(0, 1),
		footerStyle: renderer.NewStyle().
			Foreground(lipgloss.Color("241")).
			Padding(0, 1),
	}
}

func (m model) Init() tea.Cmd { return nil }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		m.ready = true
		m.list.SetSize(msg.Width, msg.Height)
		if m.state == stateReading {
			m.openPost(m.current)
		}
		return m, nil

	case tea.KeyMsg:
		switch m.state {
		case stateList:
			// Don't intercept keys while the fuzzy filter is capturing input.
			if m.list.FilterState() == list.Filtering {
				break
			}
			switch msg.String() {
			case "q", "ctrl+c":
				return m, tea.Quit
			case "enter":
				if item, ok := m.list.SelectedItem().(postItem); ok {
					m.openPost(item.post)
					return m, nil
				}
			}
		case stateReading:
			switch msg.String() {
			case "q", "esc", "backspace", "left", "h":
				m.state = stateList
				return m, nil
			case "ctrl+c":
				return m, tea.Quit
			}
		}
	}

	var cmd tea.Cmd
	switch m.state {
	case stateList:
		m.list, cmd = m.list.Update(msg)
	case stateReading:
		m.viewport, cmd = m.viewport.Update(msg)
	}
	return m, cmd
}

func (m *model) openPost(p Post) {
	m.current = p
	m.state = stateReading

	width := min(m.width, 100)
	content := renderMarkdown(p, width)

	header := m.headerView()
	footer := m.footerView()
	vp := viewport.New(m.width, m.height-lipgloss.Height(header)-lipgloss.Height(footer))
	vp.SetContent(content)
	m.viewport = vp
}

func renderMarkdown(p Post, width int) string {
	doc := fmt.Sprintf("# %s\n\n*%s*\n\n%s\n", p.Title, p.Date.Format("January 2, 2006"), p.Body)
	r, err := glamour.NewTermRenderer(
		glamour.WithStandardStyle("dark"),
		glamour.WithWordWrap(max(width-4, 20)),
	)
	if err != nil {
		return doc
	}
	out, err := r.Render(doc)
	if err != nil {
		return doc
	}
	return out
}

func (m model) headerView() string {
	return m.titleStyle.Render(m.current.Title)
}

func (m model) footerView() string {
	return m.footerStyle.Render(fmt.Sprintf("%s  ·  ↑/↓ scroll · esc back · q quit  ·  %3.f%%",
		m.current.URL, m.viewport.ScrollPercent()*100))
}

func (m model) View() string {
	if !m.ready {
		return "loading..."
	}
	switch m.state {
	case stateReading:
		return m.headerView() + "\n" + m.viewport.View() + "\n" + m.footerView()
	default:
		return m.list.View()
	}
}

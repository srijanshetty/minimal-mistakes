package main

import (
	"context"
	"errors"
	"net"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/log"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/activeterm"
	"github.com/charmbracelet/wish/bubbletea"
	"github.com/charmbracelet/wish/logging"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// findSiteDir walks up from the working directory until it finds the
// directory that contains _posts, so the binary works from ssh/ or the repo
// root without configuration.
func findSiteDir() string {
	dir, err := os.Getwd()
	if err != nil {
		return "."
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "_posts")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "."
		}
		dir = parent
	}
}

func main() {
	var (
		host     = env("SSH_HOST", "0.0.0.0")
		port     = env("SSH_PORT", "2222")
		siteDir  = env("SITE_DIR", findSiteDir())
		siteURL  = env("SITE_URL", "https://srijanshetty.in")
		keyPath  = env("HOST_KEY_PATH", filepath.Join(siteDir, "ssh", ".data", "host_ed25519"))
		interval = env("SYNC_INTERVAL", "5m")
	)

	store := NewStore(siteDir, siteURL)
	if err := store.Reload(); err != nil {
		log.Fatal("could not load site content", "dir", siteDir, "err", err)
	}
	log.Info("content loaded", "dir", siteDir, "posts", len(store.Posts()))

	if d, err := time.ParseDuration(interval); err != nil || d <= 0 {
		log.Info("periodic sync disabled", "interval", interval)
	} else {
		go store.Sync(d)
		log.Info("periodic git sync enabled", "interval", d)
	}

	teaHandler := func(s ssh.Session) (tea.Model, []tea.ProgramOption) {
		renderer := bubbletea.MakeRenderer(s)
		return newModel(store, renderer), []tea.ProgramOption{tea.WithAltScreen()}
	}

	srv, err := wish.NewServer(
		wish.WithAddress(net.JoinHostPort(host, port)),
		wish.WithHostKeyPath(keyPath),
		wish.WithIdleTimeout(30*time.Minute),
		wish.WithMiddleware(
			bubbletea.Middleware(teaHandler),
			activeterm.Middleware(),
			logging.Middleware(),
		),
	)
	if err != nil {
		log.Fatal("could not create server", "err", err)
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	log.Info("starting SSH server", "host", host, "port", port)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
			log.Error("server error", "err", err)
			done <- syscall.SIGTERM
		}
	}()

	<-done
	log.Info("stopping SSH server")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil && !errors.Is(err, ssh.ErrServerClosed) {
		log.Error("could not stop server", "err", err)
	}
}

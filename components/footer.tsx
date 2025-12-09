export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="app-container-wide py-4 sm:py-5">
        <div className="flex items-center justify-center">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Développé par{" "}
            <a
              href="https://codelab.bj/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Code Lab
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

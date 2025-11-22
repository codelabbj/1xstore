export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 mt-auto">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Développé par{" "}
            <a
              href="https://wa.me/22947030588"
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


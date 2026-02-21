const Footer = () => (
  <footer id="security" className="py-16 border-t border-border bg-card">
    <div className="container">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-md gradient-navy flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-semibold text-foreground">Continuity</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Helping business owners make their businesses understandable, transferable, and buyer-ready.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Product</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Features</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Pricing</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Security</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Company</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">About</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</p>
            <p className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy</p>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 Continuity. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

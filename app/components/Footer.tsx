import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__legal">
          <Link href="/terms">Terms of Use</Link>
          <span aria-hidden="true" className="divider">
            •
          </span>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
        <div className="site-footer__meta">© {year} The Wellcome Trust</div>
      </div>
    </footer>
  );
}

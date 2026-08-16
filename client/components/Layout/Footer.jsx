import { footerCompanyLinks } from "@/static/data";
import styles from "@/styles/styles";
import Link from "next/link";
import {
  AiFillFacebook,
  AiFillInstagram,
  AiFillYoutube,
  AiOutlineTwitter,
} from "react-icons/ai";
import { SiMastercard, SiPaypal, SiStripe, SiVisa } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-border text-foreground transition-colors duration-300">
      <div className={`${styles.section} py-6`}>
        {/* Grid updated to 2 columns since Customer Care was removed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border text-sm">
          {/* Column 1: Shop Links */}
          <div className="flex flex-col space-y-2">
            <p className="font-semibold text-foreground">Shop</p>
            <ul className="flex flex-col space-y-1.5">
              {footerCompanyLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.link}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Connect & Socials */}
          <div className="flex flex-col space-y-3">
            <p className="font-semibold text-foreground">Connect With Us</p>
            <p className="text-xs text-muted-foreground">
              Follow us on social media for updates, offers, and more.
            </p>
            <div className="flex items-center space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-accent transition-colors">
                <AiFillFacebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-accent transition-colors">
                <AiOutlineTwitter size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-accent transition-colors">
                <AiFillInstagram size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="text-muted-foreground hover:text-accent transition-colors">
                <AiFillYoutube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-xs text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} Mercovia. All rights reserved.</p>
          
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-9 items-center justify-center rounded bg-[#003087]" title="PayPal">
              <SiPaypal size={14} className="text-primary-foreground " />
            </span>
            <span className="flex h-6 w-9 items-center justify-center rounded bg-[#1A1F71]" title="Visa">
              <SiVisa size={18} className="text-primary-foreground " />
            </span>
            <span className="flex h-6 w-9 items-center justify-center rounded bg-surface border border-border" title="Mastercard">
              <SiMastercard size={18} className="text-[#EB001B]" />
            </span>
            <span className="flex h-6 w-9 items-center justify-center rounded bg-[#635BFF]" title="Stripe">
              <SiStripe size={14} className="text-primary-foreground " />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
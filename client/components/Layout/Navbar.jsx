// REPLACE ENTIRE FILE CONTENTS WITH:
import { navItems } from "@/static/data";
import styles from "@/styles/styles";
import Link from "next/link";

const Navbar = ({ active }) => {
  return (
    <nav aria-label="Primary" className={`block 800px:${styles.normalFlex}`}>
      {navItems &&
        navItems.map((i, index) => (
          <div className="flex" key={index}>
            <Link
              href={i.url}
              aria-current={active === index + 1 ? "page" : undefined}
              className={`${
                active === index + 1
                ? "text-accent"
                : "text-foreground 800px:text-white"
              } pb-7.5 800px:pb-0 font-medium px-6 cursor-pointer font-Roboto`}
            >
              {i.title}
            </Link>
          </div>
        ))}
    </nav>
  );
};

export default Navbar;
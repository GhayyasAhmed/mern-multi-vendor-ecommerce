import { footerCompanyLinks } from "@/static/data"
import Image from "next/image";
import Link from "next/link";
import {
  AiFillFacebook,
  AiFillInstagram,
  AiFillYoutube,
  AiOutlineTwitter,
} from "react-icons/ai";
import { SiVisa, SiMastercard, SiPaypal, SiStripe } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      {/* Main Footer Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:px-8 px-5 py-16 sm:text-center">
        <ul className="px-5 text-center sm:text-start flex flex-col sm:block items-center">
          <Image
            src="/svg-image-2.svg"
            alt="Logo"
            width={250}
            height={250}
            className="brightness-0 invert"
          />
          <br />
          <p className="text-sm leading-6">
            The home and elements needed for create beautiful products.
          </p>

          <div className="flex items-center mt-3.75 space-x-3.5">
            <AiFillFacebook size={25} className="cursor-pointer" />
            <AiOutlineTwitter size={25} className="cursor-pointer" />
            <AiFillInstagram size={25} className="cursor-pointer" />
            <AiFillYoutube size={25} className="cursor-pointer" />
          </div>
        </ul>

        {/* Shop Links */}
        <ul className="text-center sm:text-start">
          <h1 className="mb-1 font-semibold">Shop</h1>
          {footerCompanyLinks.map((link, index) => (
            <li key={index}>
              <Link
                className="text-gray-400 hover:text-teal-400 duration-300 text-sm leading-6 cursor-pointer"
                href={link.link}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-center pt-2 text-gray-400 text-sm pb-8 items-center px-4">
        <span>© {new Date().getFullYear()} Mercovia. All rights reserved.</span>
        <span>Terms · Privacy Policy</span>
        <div className="flex items-center justify-center gap-2 w-full">
          {/* /footer-payment.webp was missing from public/, causing a 404.
              Rebuilt as individual badges using the already-installed react-icons/si set. */}
          <span
            className="flex h-8 w-12 items-center justify-center rounded-md bg-[#003087]"
            title="PayPal"
          >
            <SiPaypal size={18} className="text-white" />
          </span>
          <span
            className="flex h-8 w-12 items-center justify-center rounded-md bg-[#1A1F71]"
            title="Visa"
          >
            <SiVisa size={22} className="text-white" />
          </span>
          <span
            className="flex h-8 w-12 items-center justify-center rounded-md bg-white border border-gray-200"
            title="Mastercard"
          >
            <SiMastercard size={22} className="text-[#EB001B]" />
          </span>
          <span
            className="flex h-8 w-12 items-center justify-center rounded-md bg-[#635BFF]"
            title="Stripe"
          >
            <SiStripe size={18} className="text-white" />
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
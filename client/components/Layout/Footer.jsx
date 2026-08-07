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
      {/* Newsletter Section */}
      <div className="md:flex md:justify-between md:items-center sm:px-12 px-4 bg-[#342ac8] py-7">
        <h1 className="lg:text-4xl text-3xl md:mb-0 mb-6 lg:leading-normal font-semibold md:w-2/5">
          <span className="text-[#56d879]">Subscribe</span> us for get news{" "}
          <br />
          events and offers
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            required
            placeholder="Enter your email..."
            className="text-gray-800 bg-white sm:w-72 w-full py-2.5 rounded px-3 focus:outline-none text-sm"
          />
          <button className="bg-[#56d879] hover:bg-teal-500 duration-300 px-5 py-2.5 rounded-md text-white font-medium md:w-auto w-full">
            Submit
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:px-8 px-5 py-16 sm:text-center">
        <ul className="px-5 text-center sm:text-start flex flex-col sm:block items-center">
          <Image
            src="/svg-image-1.svg"
            alt="ShopO Logo"
            width={150}
            height={50}
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
        <span>© {new Date().getFullYear()} Shopo. All rights reserved.</span>
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
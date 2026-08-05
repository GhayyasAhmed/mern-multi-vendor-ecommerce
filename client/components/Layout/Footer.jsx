import {
  footerCompanyLinks,
  footerProductLinks,
  footerSupportLinks,
} from "@/static/data";
import Image from "next/image";
import Link from "next/link";
import {
  AiOutlineFacebook,
  AiOutlineInstagram,
  AiOutlineTwitter,
  AiOutlineYoutube,
} from "react-icons/ai";

const Footer = () => {
  return (
    <div className="bg-black text-white">
      {/* Newsletter Section */}
      <div className="md:flex md:justify-between md:items-center sm:px-12 px-4 bg-[#342ac8] py-7">
        <h1 className="lg:text-4xl text-3xl md:mb-0 mb-6 lg:leading-normal font-semibold md:w-2/5">
          <span className="text-[#56d879]">Sub</span>scribe us for get news{" "}
          <br />
          events and offers
        </h1>
        <div>
          <input
            type="text"
            required
            placeholder="Enter your email..."
            className="text-gray-800 sm:w-72 w-full sm:mr-5 mr-1 lg:mb-0 mb-4 py-2.5 rounded px-2 focus:outline-none"
          />
          <button className="bg-[#56d879] hover:bg-teal-500 duration-300 px-5 py-2.5 rounded-md text-white md:w-auto w-full">
            Submit
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:px-8 px-5 py-16 sm:text-center">
        <ul className="px-5 text-center sm:text-start flex flex-col sm:block items-center">
          {/* FIX: Serve directly from the root '/' directory */}
          <Image
            src="/svg-image-1.svg"
            alt="Logo"
            width={150}
            height={50}
            // className="brightness-0 invert"
          />
          <br />
          <p>The home and elements needed for create beautiful products.</p>

          {/* FIX: Standardized margins or used arbitrary values */}
          <div className="flex items-center mt-4 space-x-3.5">
            <AiOutlineFacebook size={25} className="cursor-pointer" />
            <AiOutlineTwitter size={25} className="cursor-pointer" />
            <AiOutlineInstagram size={25} className="cursor-pointer" />
            <AiOutlineYoutube size={25} className="cursor-pointer" />
          </div>
        </ul>

        <ul className="text-center sm:text-start">
          <h1 className="mb-1 font-semibold">Company</h1>
          {footerProductLinks.map((link, index) => (
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

        <ul className="text-center sm:text-start">
          <h1 className="mb-1 font-semibold">Support</h1>
          {footerSupportLinks.map((link, index) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-center pt-2 text-gray-400 text-sm pb-8">
        <span>© {new Date().getFullYear()} Shopo. All rights reserved.</span>
        <span>Terms · Privacy Policy</span>
        <div className="sm:block flex items-center justify-center w-full">
          <Image
            src="https://hamart-shop.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffooter-payment.a37c0819.png&w=640&q=75"
            alt="Payment Methods"
            width={300}
            height={30}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Footer;
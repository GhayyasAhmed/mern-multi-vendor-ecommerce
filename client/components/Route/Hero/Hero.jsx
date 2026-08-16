import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/styles";

const Hero = () => {
  return (
    <div className="relative min-h-[70vh] 800px:min-h-[80vh] w-full flex items-center">
      <Image
        src="https://themes.rslahmed.dev/rafcart/assets/images/banner-2.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover "
      />
      <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-transparent dark:from-black/85 dark:via-black/55 dark:to-transparent" />
      <div className={`${styles.section} relative z-10 w-[90%] 800px:w-[60%]`}>
        <h1
          className={`text-[35px] leading-[1.2] 800px:text-[60px] text-foreground font-semibold capitalize`}
        >
          Best Collection for <br /> home Decoration
        </h1>
        <p className="pt-5 text-[16px] font-[Poppins] font-normal text-foreground">
          Discover top-quality items carefully curated to transform your living spaces.
        </p>
        <Link href="/products" className="inline-block">
          <div className={`${styles.button} mt-5`}>
            <span className="font-[Poppins] text-[18px]">Shop Now</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
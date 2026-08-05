"use client";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import CountDown from "./CountDown";

const EventCard = ({ active, data }) => {
  return (
    <div
      className={`w-full block bg-white rounded-lg ${
        active ? "unset" : "mb-12"
      } lg:flex p-2`}
    >
      <div className="w-full lg:w-[50%] m-auto relative h-75">
        <Image
          src={
            data?.image_Url?.[0]?.url ||
            "https://m.media-amazon.com/images/I/71TPda7cwUL._AC_SL1500_.jpg"
          }
          alt={data?.name || "Event Product"}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <div className="w-full lg:w-[50%] flex flex-col justify-center p-4">
        <h2 className={`${styles.productTitle}`}>
          {data?.name || "Iphone 14 Pro Max 256GB SSD and 8GB RAM Silver Colour"}
        </h2>
        <p className="py-2 text-[15px] leading-6 font-normal text-[#000000a6]">
          {data?.description ||
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum, ab! Accusantium sapiente laudantium eveniet error impedit, perferendis architecto aut inventore eaque distinctio corporis culpa placeat ad id quas non omnis!"}
        </p>
        <div className="flex py-2 justify-between">
          <div className="flex">
            <h5 className="font-medium text-[18px] text-[#d55b45] pr-3 line-through">
              {data?.originalPrice ? `${data.originalPrice}$` : "1099$"}
            </h5>
            <h5 className="font-bold text-[20px] text-[#333] font-Roboto">
              {data?.discountPrice ? `${data.discountPrice}$` : "999$"}
            </h5>
          </div>
          <span className="pr-3 font-normal text-[17px] text-[#44a55e]">
            {data?.sold_out || "120"} sold
          </span>
        </div>
        <CountDown data={data} />
        <br />
        <div className="flex items-center">
          <Link href={`/product/${data?._id || "event-details"}?isEvent=true`}>
            <div className={`${styles.button} text-white`}>See Details</div>
          </Link>
          <div className={`${styles.button} text-white ml-5`}>Add to cart</div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
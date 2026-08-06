"use client";
import React, { useEffect, useState } from "react";

// Pure helper moved outside component scope
const calculateTimeLeft = (finishDate) => {
  const targetDate = finishDate
    ? new Date(finishDate)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const difference = +targetDate - +new Date();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

const CountDown = ({ data }) => {
  const finishDate = data?.Finish_Date;
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(finishDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(finishDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [finishDate]);

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval} className="text-[16px] text-[#333]">
        {timeLeft[interval]} {interval}{" "}
      </span>
    );
  });

  return (
    <div>
      {timerComponents.length ? (
        timerComponents
      ) : (
        <span className="text-[red] text-[18px]">Time&apos;s up!</span>
      )}
    </div>
  );
};

export default CountDown;
"use client";
import { useEffect, useState } from "react";

const getTimeDetails = (finishDate) => {
  const targetDate = finishDate
    ? new Date(finishDate)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const difference = +targetDate - +new Date();

  if (difference <= 0) {
    return { expired: true };
  }

  const totalHours = Math.floor(difference / (1000 * 60 * 60));
  const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));

  if (totalHours < 24) {
    return {
      type: 'hours',
      hours: totalHours,
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  } else if (totalDays < 30) {
    return {
      type: 'days',
      days: totalDays,
    };
  } else {
    const months = Math.floor(totalDays / 30);
    return {
      type: 'months',
      months: months,
    };
  }
};

const CountDownOption1 = ({ data }) => {
  const finishDate = data?.Finish_Date;
  const [timeDetails, setTimeDetails] = useState(() => getTimeDetails(finishDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeDetails(getTimeDetails(finishDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [finishDate]);

  if (timeDetails.expired) {
    return <span className="text-error text-sm font-semibold">Time&apos;s up!</span>;
  }

  const isUrgent = timeDetails.type === 'hours';

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${isUrgent ? 'bg-error-bg text-error border border-error/30 animate-pulse' : 'bg-muted text-foreground'
      }`}>
      <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-error' : 'bg-muted-foreground'}`} />
      {timeDetails.type === 'hours' && (
        <span>{timeDetails.hours} hours {timeDetails.minutes} minutes {timeDetails.seconds} seconds</span>
      )}
      {timeDetails.type === 'days' && (
        <span>{timeDetails.days} days left</span>
      )}
      {timeDetails.type === 'months' && (
        <span>{timeDetails.months} {timeDetails.months === 1 ? 'month' : 'months'} left</span>
      )}
    </div>
  );
};

export default CountDownOption1;
"use client";
import EmptyState from "@/components/ui/EmptyState";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getErrorMessage } from "@/features/auth/utils";
import { useCreateReviewMutation, useGetReviewEligibilityQuery } from "@/features/products/productApiSlice";
import styles from "@/styles/styles";
import Image from "next/image";
import { useState } from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const ProductReviews = ({ product, productId }) => {
  const { user } = useCurrentUser();
  const reviews = product?.reviews ?? [];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { data: eligibility, isLoading: isCheckingEligibility } = useGetReviewEligibilityQuery(
    productId,
    { skip: !user || !productId }
  );
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    if (!eligibility?.orderId) return;
    try {
      await createReview({ productId, orderId: eligibility.orderId, rating, comment: comment.trim() || undefined }).unwrap();
      setSuccessMessage("Thanks for your review!");
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not submit your review."));
    }
  };

  return (
    <div className="mt-16">
      <div className={`${styles.heading}`}>
        <h1>Reviews {reviews.length > 0 ? `(${reviews.length})` : ""}</h1>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<AiOutlineStar size={22} />}
          title="No reviews yet"
          description="Be the first to review this product."
          className="py-10"
        />
      ) : (
        <div className="space-y-4 mb-8">
          {reviews.map((review, index) => {
            const reviewer = typeof review.user === "object" ? review.user : null;
            return (
              <div key={review._id || index} className="bg-surface rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                    {reviewer?.avatar?.url ? (
                      <Image src={reviewer.avatar.url} alt={reviewer?.name || "Reviewer"} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{reviewer?.name || "Anonymous"}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) =>
                        i < review.rating ? (
                          <AiFillStar key={i} size={14} color="#F6BA00" />
                        ) : (
                          <AiOutlineStar key={i} size={14} color="#F6BA00" />
                        )
                      )}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-[14px] text-[#555]">{review.comment}</p>}
              </div>
            );
          })}
        </div>
      )}

      {user && !isCheckingEligibility && eligibility?.canReview && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-sm p-6 max-w-xl space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {eligibility.existingReview ? "Update your review" : "Write a review"}
          </h3>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return value <= rating ? (
                <AiFillStar key={i} size={22} color="#F6BA00" className="cursor-pointer" onClick={() => setRating(value)} />
              ) : (
                <AiOutlineStar key={i} size={22} color="#F6BA00" className="cursor-pointer" onClick={() => setRating(value)} />
              );
            })}
          </div>
          <textarea rows={3} placeholder="Share your experience with this product..." value={comment} onChange={(e) => setComment(e.target.value)} className={`${styles.input}`} />
          {formError && <p className="text-sm text-error">{formError}</p>}
          {successMessage && <p className="text-sm text-success">{successMessage}</p>}
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-sm disabled:opacity-60 cursor-pointer">
            {isSubmitting ? "Submitting..." : eligibility.existingReview ? "Update review" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductReviews;
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  hasLiked,
  getLikesCount,
  likeTarget,
  unlikeTarget,
} from "@/services/likesService";
import { Button } from "@/components/ui/button";

export default function LikeButton({
  targetType,
  targetId,
  size = "sm",
  variant = "ghost",
  className = "",
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // -------------------------------------------------------------
  // Chargement initial : like de l'user + total des likes
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const [liked, count] = await Promise.all([
          hasLiked(targetType, targetId),
          getLikesCount(targetType, targetId),
        ]);

        if (!active) return;

        setIsLiked(liked);
        setLikesCount(count);
      } catch (err) {
        console.error("LikeButton load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [targetType, targetId]);

  // -------------------------------------------------------------
  // Toggle like / unlike
  // -------------------------------------------------------------
  async function toggleLike() {
    if (processing) return;
    setProcessing(true);

    try {
      if (isLiked) {
        // Optimistic update
        setIsLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));

        await unlikeTarget(targetType, targetId);
      } else {
        // Optimistic update
        setIsLiked(true);
        setLikesCount((c) => c + 1);

        await likeTarget(targetType, targetId);
      }
    } catch (err) {
      console.error("toggleLike error:", err);

      // revert optimistic update if fail
      setIsLiked((prev) => !prev);
      setLikesCount((prev) =>
        isLiked ? prev + 1 : Math.max(0, prev - 1)
      );
    } finally {
      setProcessing(false);
    }
  }

  // -------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------
  const heartClasses = [
    "w-3 h-3 transition-all",
    isLiked ? "fill-red-500 text-red-500 " : "text-neutral-400",
  ].join(" ");

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleLike}
      disabled={loading || processing}
      className={`flex items-center gap-1 ${className}`}
      title={isLiked ? "Retirer le like" : "Liker"}
    >
      <Heart className={heartClasses} />
      <span className="text-[10px]">{likesCount}</span>
    </Button>
  );
}

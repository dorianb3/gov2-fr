import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import {
  follow,
  unfollow,
  isFollowingTarget,
  getFollowersCount,
} from "@/services/followsService";
import { Button } from "@/components/ui/button";

export default function FollowButton({
  targetType,
  targetId,
  size = "sm",
  variant = "ghost",
  className = "",
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // -------------------------------------------------------------
  // Chargement initial : état + nombre d'abonnés
  // -------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [following, count] = await Promise.all([
          isFollowingTarget(targetType, targetId),
          getFollowersCount(targetType, targetId),
        ]);

        if (!active) return;

        setIsFollowing(following);
        setFollowersCount(count);
      } catch (err) {
        console.error("FollowButton load error:", err);
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
  // Toggle Follow / Unfollow (optimistic)
  // -------------------------------------------------------------
  async function toggleFollow() {
    if (processing) return;
    setProcessing(true);

    try {
      if (isFollowing) {
        // optimistic
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));

        await unfollow(targetType, targetId);
      } else {
        // optimistic
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);

        await follow(targetType, targetId);
      }
    } catch (err) {
      console.error("toggleFollow error:", err);

      // revert if fail
      setIsFollowing((prev) => !prev);
      setFollowersCount((prev) =>
        isFollowing ? prev + 1 : Math.max(0, prev - 1)
      );
    } finally {
      setProcessing(false);
    }
  }

  // -------------------------------------------------------------
  // Icone étoile
  // -------------------------------------------------------------
  const starClasses = [
    "w-3 h-3 transition-all",
    isFollowing
      ? "fill-yellow-400 text-yellow-400 "
      : "text-neutral-400",
  ].join(" ");

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleFollow}
      disabled={loading || processing}
      className={`flex items-center gap-1 ${className}`}
      title={isFollowing ? "Se désabonner" : "Suivre"}
    >
      <Star className={starClasses} />
      <span className="text-[10px]">{followersCount}</span>
    </Button>
  );
}

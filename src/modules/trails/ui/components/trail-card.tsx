import Link from "next/link";
import Image from "next/image";
import { BookOpenIcon, LayersIcon } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface TrailCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  stepCount: number;
  user: {
    name: string;
    imageUrl: string;
  };
}

export const TrailCard = ({
  id,
  title,
  description,
  thumbnailUrl,
  stepCount,
  user,
}: TrailCardProps) => {
  return (
    <Link prefetch href={`/trails/${id}`} className="flex flex-col gap-4 group">
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted flex items-center justify-center">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <BookOpenIcon className="size-12 text-muted-foreground" />
        )}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          <LayersIcon className="size-3" />
          <span>{stepCount} steps</span>
        </div>
      </div>
      <div className="flex gap-3">
        <UserAvatar name={user.name} imageUrl={user.imageUrl} />
        <div className="flex flex-col gap-1 overflow-hidden">
          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary">{title}</h3>
          <p className="text-sm text-muted-foreground">{user.name}</p>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

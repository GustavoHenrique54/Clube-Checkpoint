import React from "react";
import { Calendar, Trophy, Gamepad, Users } from "lucide-react";

function getMembershipDuration(createdDate) {
  if (!createdDate) return "Novo membro";
  const created = new Date(createdDate);
  const now = new Date();
  const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} dia${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mês${months !== 1 ? "es" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ano${years !== 1 ? "s" : ""}`;
  return `${years} ano${years !== 1 ? "s" : ""} e ${rem} mês${rem !== 1 ? "es" : ""}`;
}

const SocialLink = ({ href, icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={label}
    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all border border-white/10"
  >
    <span>{icon}</span>
    <span className="truncate max-w-[80px]">{label}</span>
  </a>
);

export default function ProfileHeader({ user, badgeCount = 0, rareBadgeCount = 0, friendCount = 0, onUploadCover }) {
  const memberSince = user.created_date ?
  new Date(user.created_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) :
  "Recentemente";

  const stats = [
  { icon: Trophy, label: "Emblemas", value: badgeCount },
  { icon: Gamepad, label: "Games", value: user.games_completed || 0 },
  { icon: Users, label: "Encontros", value: user.meetings_attended || 0 },
  { icon: Trophy, label: "Raros+", value: rareBadgeCount },
  { icon: Users, label: "Amigos", value: friendCount }];

  const socials = [
  user.instagram && { href: `https://instagram.com/${user.instagram}`, icon: "📸", label: `@${user.instagram}` },
  user.discord && { href: "#", icon: "💬", label: user.discord },
  user.steam && { href: user.steam.startsWith("http") ? user.steam : `https://steamcommunity.com/id/${user.steam}`, icon: "🎮", label: user.steam.startsWith("http") ? "Steam" : user.steam },
  user.psn_username && { href: "#", icon: "🎮", label: `PSN: ${user.psn_username}` },
  user.xbox_username && { href: "#", icon: "🎮", label: `Xbox: ${user.xbox_username}` }].
  filter(Boolean);

  return (
    <div className="relative">
      {/* Banner */}
      <div className="relative h-28 sm:h-36 ckpnt-pattern overflow-hidden bg-ps-blue">
        {user.cover_image &&
        <img src={user.cover_image} alt="Capa" className="absolute inset-0 w-full h-full object-cover" />
        }
        {onUploadCover &&
        <label className="absolute bottom-2 right-3 cursor-pointer z-10">
            <input type="file" accept="image/*" onChange={onUploadCover} className="hidden" />
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold hover:bg-black/80 transition-colors border border-white/20">
              📷 Alterar capa
            </div>
          </label>
        }
      </div>

      <div className="relative z-10 px-6 pb-6 -mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-32 h-32 rounded-full bg-ps-dark-canvas border-4 border-ps-dark-canvas overflow-hidden flex-shrink-0 shadow-xl">
            {user.profile_image ?
            <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" /> :

            <div className="w-full h-full flex items-center justify-center bg-ps-blue">
                <span className="text-3xl font-black text-white">{(user.display_name || user.full_name)?.[0]?.toUpperCase() || "?"}</span>
              </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white mt-12 text-2xl font-bold uppercase truncate font-display tracking-wide">
              {user.display_name || user.full_name}
            </h1>
            {user.username && <p className="text-white/60 text-sm font-semibold">@{user.username}</p>}
            <div className="flex items-center gap-1.5 mt-1 text-white/50 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-ps-blue" />
              <span>Membro desde {memberSince}</span>
              <span className="mx-1">·</span>
              <span>{getMembershipDuration(user.created_date)}</span>
            </div>
          </div>
        </div>

        {user.bio &&
        <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-2xl">{user.bio}</p>
        }

        {socials.length > 0 &&
        <div className="flex flex-wrap gap-2 mt-4">
            {socials.map((s, i) =>
          <SocialLink key={i} href={s.href} icon={s.icon} label={s.label} />
          )}
          </div>
        }

        <div className="grid grid-cols-5 gap-3 mt-5">
          {stats.map((stat) =>
          <div key={stat.label} className="bg-ps-dark-card rounded-md p-3 text-center border border-white/10">
              <stat.icon className="w-4 h-4 text-ps-blue mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>);

}
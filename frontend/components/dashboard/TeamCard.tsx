import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Team, UserProfile } from '../../types/api';
import { MemberAvatars } from '../shared/MemberAvatars';
import { IconArrowButton } from '../ui/IconArrowButton';

interface TeamCardProps {
  team: Team;
  members: UserProfile[];
  membersLoading: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  members,
  membersLoading,
}) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const showLogo = team.logo_url && !imageError;

  const handleTeamClick = () => {
    router.push(`/team-site/${team.id}`);
  };
  
  return (
    <div
      className="w-full flex items-center border border-grey-accent-200 rounded-xl bg-white hover:border-grey-accent-300 transition-all duration-200 cursor-pointer"
      onClick={handleTeamClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Left Section: Logo, Name, and Date */}
      <div className="flex items-center gap-x-4 p-3 flex-shrink-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-grey-accent-200 flex-shrink-0 flex items-center justify-center">
          {showLogo ? (
            <img
              src={team.logo_url}
              alt={`${team.name} logo`}
              className="w-full h-full object-cover bg-gray-100"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center">
              <span className="text-white text-base font-bold">
                {team.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-base font-semibold text-grey-accent-900">{team.name}</h4>
          <span className="text-xs text-grey-accent-500 whitespace-nowrap">
            Created: {new Date(team.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Middle Section: Description */}
      <p className="flex-1 min-w-0 truncate text-sm text-grey-accent-700 px-4">
        {team.description}
      </p>

      {/* Right Section: Member Avatars */}
      <div className="pr-4">
        <MemberAvatars
          members={members || []}
          membersLoading={membersLoading}
          maxVisible={5}
          size="md"
          showMemberCount={false}
        />
      </div>

      {/* End-Cap Button */}
      <div className="self-stretch flex items-center px-4">
        <IconArrowButton
          ariaLabel={`Open team ${team.name}`}
          variant="light"
          isHovered={isHovered}
        />
      </div>
    </div>
  );
};
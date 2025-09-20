'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  MessageCircle,
  Plus,
  User,
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { conversationsService } from '@/services/conversations-service';

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  school_email: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Get current user profile
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUser(profile);
        }
      }
    };
    getCurrentUser();
  }, []);

  // Get unread messages count
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return conversationsService.getConversations({
        user_id: user.id,
        is_active: true
      });
    },
    refetchInterval: 30000,
  });

  const totalUnreadCount = conversations?.reduce(
    (total, conv) => total + (conv.unread_count || 0), 
    0
  ) || 0;

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      exact: true
    },
    {
      label: 'Messages',
      path: '/dashboard/messages',
      icon: MessageCircle,
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined
    }
  ];

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white border-b shadow-sm">
      {/* Logo and Brand */}
      <div className="flex items-center gap-8">
        <h1
          onClick={() => router.push('/dashboard')}
          className="text-xl font-bold cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
        >
          Better Zlecenia
        </h1>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact 
              ? pathname === item.path 
              : isActive(item.path);

            return (
              <Button
                key={item.path}
                variant={active ? 'default' : 'ghost'}
                size="sm"
                onClick={() => router.push(item.path)}
                className="relative"
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Search Button */}
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-1 rounded-full">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage 
                  src={currentUser?.avatar_url} 
                  alt={currentUser?.full_name || currentUser?.username || 'User'} 
                />
                <AvatarFallback className="text-sm">
                  {getInitials(currentUser?.full_name || currentUser?.username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">
                {currentUser?.full_name || currentUser?.username || 'User'}
              </div>
              <div className="text-gray-500 text-xs truncate">
                {currentUser?.school_email}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loading}>
              <LogOut className="mr-2 h-4 w-4" />
              {loading ? 'Logging out…' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
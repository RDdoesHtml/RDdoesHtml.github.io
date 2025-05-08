import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { Loader2, Activity, ArrowLeft, Filter, Search } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserActivity = {
  id: number;
  userId: number;
  timestamp: string;
  activityType: string;
  path: string;
  details: Record<string, any>;
};

export default function ActivityPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  
  // Fetch user activity
  const { 
    data: activities, 
    isLoading,
    error 
  } = useQuery<UserActivity[]>({
    queryKey: ['/api/user/activity'],
    queryFn: getQueryFn({ on401: 'throw' }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Filter activities
  const filteredActivities = activities?.filter(activity => {
    // Apply search term filter
    const matchesSearch = searchTerm === '' || 
      activity.activityType.toLowerCase().includes(searchTerm.toLowerCase()) || 
      activity.path?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply activity type filter
    const matchesType = activityFilter === 'all' || activity.activityType === activityFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Get unique activity types for filter
  const activityTypes = activities ? 
    ['all', ...new Set(activities.map(a => a.activityType))] : 
    ['all'];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Loading activity data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-destructive">
              Error Loading Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sorry, we couldn't load your activity information. Please try again later.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Activity History</h1>
        <p className="text-muted-foreground">Track all your account activities</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-full">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter activities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Activities' : type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Activity Log
            </span>
            <Badge variant="outline" className="ml-2">
              {filteredActivities?.length || 0} {filteredActivities?.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities && filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(activity.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {activity.activityType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{activity.path || '-'}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {activity.details && Object.keys(activity.details).length > 0 ? 
                        JSON.stringify(activity.details).substring(0, 50) + 
                        (JSON.stringify(activity.details).length > 50 ? '...' : '')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    {activities && activities.length > 0 ? 
                      'No activities match your filters' : 
                      'No activity records found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { ArrowLeft, User, Lock, Clock, LogOut } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Simple version to be completed later
export default function DashboardPage() {
  const { user, logoutMutation } = useAuth();
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button asChild variant="ghost" className="mb-2 pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Account Dashboard</h1>
        </div>
        <Button onClick={handleLogout} variant="outline" className="flex items-center">  
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
      
      {/* User Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5 text-primary" />
            Account Overview
          </CardTitle>
          <CardDescription>Welcome back, {user?.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium">Username</h3>
                <p>{user?.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Account Created</h3>
                <p>Coming soon</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium">Last Login</h3>
                <p>Coming soon</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Login Method</h3>
                <p>Password</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Coming Soon Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Recent Login Activity
            </CardTitle>
            <CardDescription>Track your recent account logins</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[100px] flex items-center justify-center">
            <p className="text-muted-foreground italic">Login history coming soon</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[100px] flex items-center justify-center">
            <p className="text-muted-foreground italic">Security settings coming soon</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>This dashboard is under active development. More features coming soon!</p>
      </div>
    </div>
  );
}
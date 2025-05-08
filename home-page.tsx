import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon, BarChart3 } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Dashboard</CardTitle>
          <CardDescription>You are now logged in as {user?.username}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">This is a protected page that can only be accessed after successful authentication.</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5" asChild>
              <Link href="/dashboard">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span>User Dashboard</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5" asChild>
              <Link href="/activity">
                <ActivityIcon className="h-6 w-6 text-primary" />
                <span>Activity Log</span>
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full"
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

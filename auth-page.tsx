import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";
import { signInWithGoogle, signInWithMicrosoft } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const [isOnRoute] = useRoute('/auth');
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect to home if user is already logged in
  if (user && isOnRoute) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit: SubmitHandler<LoginFormValues> = (data) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegisterSubmit: SubmitHandler<RegisterFormValues> = (data) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Handler for Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      
      if (firebaseUser) {
        console.log("Firebase user authenticated:", firebaseUser);
        
        // Either log in or register the user in our system based on the email
        // For now, we'll just redirect to home to show it worked
        // In a real app, you would add server-side logic to handle this
        // by creating a user account or logging in the existing user
        
        // Show alert for demo purpose - could be replaced with proper server integration
        alert(`Successfully signed in as ${firebaseUser.displayName || firebaseUser.email}`);
        
        // Redirect to home page
        setLocation('/');
      }
    } catch (error: any) {
      console.error("Google sign in failed:", error);
      
      // Format a user-friendly error message
      let errorMessage = "Google sign in failed. Please try again.";
      
      // Check for unauthorized domain error (common in development)
      if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = "Authentication Error: This domain is not authorized for Firebase authentication. Please add this domain to the Firebase Console under Authentication > Settings > Authorized domains.";
      }
      
      // Show error notification
      alert(errorMessage);
    }
  };
  
  // Placeholder handlers for other providers
  const handleAppleSignIn = () => {
    alert("Apple sign in feature coming soon!");
  };
  
  // Handler for Microsoft sign-in
  const handleMicrosoftSignIn = async () => {
    try {
      const firebaseUser = await signInWithMicrosoft();
      
      if (firebaseUser) {
        console.log("Firebase user authenticated with Microsoft:", firebaseUser);
        
        // Either log in or register the user in our system based on the email
        // For now, we'll just redirect to home to show it worked
        // In a real app, you would add server-side logic to handle this
        
        // Show alert for demo purpose - could be replaced with proper server integration
        alert(`Successfully signed in as ${firebaseUser.displayName || firebaseUser.email}`);
        
        // Redirect to home page
        setLocation('/');
      }
    } catch (error: any) {
      console.error("Microsoft sign in failed:", error);
      
      // Format a user-friendly error message
      let errorMessage = "Microsoft sign in failed. Please try again.";
      
      // Check for specific errors
      if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = "Authentication Error: This domain is not authorized for Firebase authentication. Please add this domain to the Firebase Console under Authentication > Settings > Authorized domains.";
      } else if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in cancelled. You closed the Microsoft sign-in popup.";
      }
      
      // Show error notification
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600">
      <div className="w-full max-w-md form-enter">
        <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 text-center">
            <div className="mx-auto h-12 w-12 mb-2 flex items-center justify-center bg-primary-100 rounded-full">
              <Lock className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
            <p className="text-gray-500 mt-1">Enter your credentials to access your account</p>
            
            {loginMutation.error && (
              <Alert variant="destructive" className="mt-4 shake">
                <AlertDescription>
                  {loginMutation.error.message || "Login failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            {registerMutation.error && (
              <Alert variant="destructive" className="mt-4 shake">
                <AlertDescription>
                  {registerMutation.error.message || "Registration failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          
          <Tabs defaultValue="login" onValueChange={(value) => {
              // Set data-state attribute on the TabsList element for animation
              const tabsList = document.querySelector('.custom-tabs-list');
              if (tabsList) {
                tabsList.setAttribute('data-state', value);
              }
              // Update the active tab state to change the social login buttons text
              setActiveTab(value as "login" | "register");
            }}>
            <div className="px-8">
              <TabsList className="w-full mb-6 custom-tabs-list" data-state="login">
                <TabsTrigger value="login" className="w-1/2 custom-tab-trigger">Login</TabsTrigger>
                <TabsTrigger value="register" className="w-1/2 custom-tab-trigger">Register</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="login" className="px-8 pb-8 custom-tab-content">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <User className="h-4 w-4" />
                            </span>
                            <Input 
                              {...field} 
                              placeholder="Enter your email or username" 
                              className="pl-10 py-2.5 input-transition"
                              autoComplete="username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Password</FormLabel>
                          <a href="#" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Lock className="h-4 w-4" />
                            </span>
                            <Input 
                              {...field} 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter your password" 
                              className="pl-10 pr-10 py-2.5 input-transition"
                              autoComplete="current-password"
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="remember-me"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel 
                            htmlFor="remember-me" 
                            className="text-sm font-medium cursor-pointer"
                          >
                            Remember me
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full py-2.5"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </div>
                    ) : "Sign in"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register" className="px-8 pb-8 custom-tab-content">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <User className="h-4 w-4" />
                            </span>
                            <Input 
                              {...field} 
                              placeholder="Choose a username" 
                              className="pl-10 py-2.5 input-transition"
                              autoComplete="username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Lock className="h-4 w-4" />
                            </span>
                            <Input 
                              {...field} 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create a password" 
                              className="pl-10 pr-10 py-2.5 input-transition"
                              autoComplete="new-password"
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Lock className="h-4 w-4" />
                            </span>
                            <Input 
                              {...field} 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              className="pl-10 pr-10 py-2.5 input-transition"
                              autoComplete="new-password"
                            />
                            <button 
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label="Toggle confirm password visibility"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full py-2.5"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating account...</span>
                      </div>
                    ) : "Create account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium rounded-full shadow-sm">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col space-y-3">
            <Button 
              variant="outline" 
              className="h-10 flex items-center justify-center relative overflow-hidden social-button-hover"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 opacity-10 gradient-pulse"></div>
              <div className="flex items-center">
                <FaGoogle className="h-5 w-5 mr-2 text-red-500" />
                <span>{activeTab === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-10 flex items-center justify-center relative overflow-hidden social-button-hover"
              onClick={handleAppleSignIn}
              type="button"
            >
              <div className="absolute inset-0 bg-black opacity-5"></div>
              <div className="flex items-center">
                <FaApple className="h-5 w-5 mr-2" />
                <span>{activeTab === "login" ? "Sign in with Apple" : "Sign up with Apple"}</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-10 flex items-center justify-center relative overflow-hidden social-button-hover"
              onClick={handleMicrosoftSignIn}
              type="button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 opacity-10 gradient-pulse"></div>
              <div className="flex items-center">
                <FaMicrosoft className="h-5 w-5 mr-2 text-blue-500" />
                <span>{activeTab === "login" ? "Sign in with Microsoft" : "Sign up with Microsoft"}</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

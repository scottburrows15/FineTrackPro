import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getDisplayName } from "@/lib/userUtils";
import { User, Save, Upload, Camera, ArrowLeft } from "lucide-react";
import type { User as UserType, Notification } from "@shared/schema";
import AppLayout from "@/components/ui/app-layout";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currentUser, isLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    position: "",
    nickname: "",
  });

  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Initialize form when user data loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        position: currentUser.position || "",
        nickname: currentUser.nickname || "",
      });
      setPreviewImage(currentUser.profileImageUrl || "");
    }
  }, [currentUser]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('playerId', currentUser!.id);
      
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewImage(data.imageUrl);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Image Uploaded",
        description: "Profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide first name and last name.",
        variant: "destructive",
      });
      return;
    }

    updateProfile.mutate(formData);
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      setLocation('/admin/settings');
    } else {
      setLocation('/player/settings');
    }
  };

  if (!user) {
    return null;
  }

  const currentView = user.role === 'admin' ? 'admin' : 'player';

  return (
    <AppLayout
      user={user}
      currentView={currentView}
      pageTitle="Edit Profile"
      unreadNotifications={unreadCount}
      onViewChange={(view) => setLocation(view === 'player' ? '/player/home' : '/admin/home')}
      canSwitchView={user.role === 'admin'}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>

        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <Separator className="my-6" />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                    {previewImage || currentUser?.profileImageUrl ? (
                      <img
                        src={previewImage || currentUser?.profileImageUrl || ""}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        data-testid="img-profile-preview"
                      />
                    ) : (
                      <span className="text-2xl font-medium text-slate-600 dark:text-slate-300">
                        {currentUser ? getDisplayName(currentUser).split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
                    data-testid="button-change-picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Upload Actions */}
                {selectedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 w-full">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">{selectedFile.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => uploadImage.mutate(selectedFile)}
                      disabled={uploadImage.isPending}
                      className="text-xs"
                      data-testid="button-upload-image"
                    >
                      {uploadImage.isPending ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewImage(currentUser?.profileImageUrl || "");
                      }}
                      className="text-xs"
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file"
                />

                <p className="text-xs text-muted-foreground text-center">
                  Recommended: Square image, at least 200x200px, max 5MB
                </p>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nickname">Team Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Enter team nickname"
                  data-testid="input-nickname"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A fun name your teammates know you by
                </p>
              </div>

              <div>
                <Label htmlFor="position">Position (Optional)</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Enter position"
                  data-testid="input-position"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your role or position in the team
                </p>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={currentUser?.email || ''}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900"
                  data-testid="input-email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex-1"
                  data-testid="button-save"
                >
                  {updateProfile.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

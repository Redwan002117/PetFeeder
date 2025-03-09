import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { database, ref, onValue, off, push, update, remove, serverTimestamp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Cat, Dog, Rabbit, Bird, Fish, Paw, Camera, Loader2 } from "lucide-react";
import PageHeader from '@/components/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/Spinner';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  feedingSchedule?: string;
  foodType?: string;
  foodAmount?: number;
  notes?: string;
  photoURL?: string;
  createdAt: number;
}

const PetProfiles = () => {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cat',
    breed: '',
    age: '',
    weight: '',
    feedingSchedule: '',
    foodType: '',
    foodAmount: '',
    notes: '',
    photoURL: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) return;

    const petsRef = ref(database, `users/${currentUser.uid}/pets`);
    
    const petsListener = onValue(petsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setPets([]);
        setLoading(false);
        return;
      }
      
      const petsData = snapshot.val();
      
      // Convert to array
      const petsArray = Object.entries(petsData || {}).map(([id, data]: [string, any]) => ({
        id,
        ...data
      }));
      
      // Sort pets by name
      petsArray.sort((a, b) => a.name.localeCompare(b.name));
      
      setPets(petsArray);
      setLoading(false);
    });
    
    // Clean up listener on component unmount
    return () => {
      off(petsRef);
    };
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'cat',
      breed: '',
      age: '',
      weight: '',
      feedingSchedule: '',
      foodType: '',
      foodAmount: '',
      notes: '',
      photoURL: ''
    });
  };

  const handleAddPet = async () => {
    if (!currentUser) return;
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your pet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPetRef = push(ref(database, `users/${currentUser.uid}/pets`));
      
      const newPet = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        feedingSchedule: formData.feedingSchedule || null,
        foodType: formData.foodType || null,
        foodAmount: formData.foodAmount ? parseFloat(formData.foodAmount) : null,
        notes: formData.notes || null,
        photoURL: formData.photoURL || null,
        createdAt: serverTimestamp()
      };
      
      await update(newPetRef, newPet);
      
      toast({
        title: "Pet Added",
        description: `${formData.name} has been added to your pets.`,
        variant: "default",
      });
      
      resetForm();
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding pet:', error);
      toast({
        title: "Error",
        description: "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      age: pet.age ? pet.age.toString() : '',
      weight: pet.weight ? pet.weight.toString() : '',
      feedingSchedule: pet.feedingSchedule || '',
      foodType: pet.foodType || '',
      foodAmount: pet.foodAmount ? pet.foodAmount.toString() : '',
      notes: pet.notes || '',
      photoURL: pet.photoURL || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdatePet = async () => {
    if (!currentUser || !selectedPet) return;
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your pet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const petRef = ref(database, `users/${currentUser.uid}/pets/${selectedPet.id}`);
      
      const updatedPet = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        feedingSchedule: formData.feedingSchedule || null,
        foodType: formData.foodType || null,
        foodAmount: formData.foodAmount ? parseFloat(formData.foodAmount) : null,
        notes: formData.notes || null,
        photoURL: formData.photoURL || null
      };
      
      await update(petRef, updatedPet);
      
      toast({
        title: "Pet Updated",
        description: `${formData.name}'s information has been updated.`,
        variant: "default",
      });
      
      resetForm();
      setEditDialogOpen(false);
      setSelectedPet(null);
    } catch (error) {
      console.error('Error updating pet:', error);
      toast({
        title: "Error",
        description: "Failed to update pet information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (pet: Pet) => {
    setSelectedPet(pet);
    setDeleteDialogOpen(true);
  };

  const handleDeletePet = async () => {
    if (!currentUser || !selectedPet) return;

    try {
      const petRef = ref(database, `users/${currentUser.uid}/pets/${selectedPet.id}`);
      await remove(petRef);
      
      toast({
        title: "Pet Removed",
        description: `${selectedPet.name} has been removed from your pets.`,
        variant: "default",
      });
      
      setDeleteDialogOpen(false);
      setSelectedPet(null);
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast({
        title: "Error",
        description: "Failed to remove pet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      // Simulate photo upload (in a real app, you'd upload to Firebase Storage)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock URL for demo purposes
      const photoURL = `https://source.unsplash.com/random/300x300/?${formData.type}`;
      
      setFormData(prev => ({ ...prev, photoURL }));
      
      toast({
        title: "Photo Uploaded",
        description: "Pet photo has been uploaded successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getPetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cat':
        return <Cat className="h-5 w-5" />;
      case 'dog':
        return <Dog className="h-5 w-5" />;
      case 'rabbit':
        return <Rabbit className="h-5 w-5" />;
      case 'bird':
        return <Bird className="h-5 w-5" />;
      case 'fish':
        return <Fish className="h-5 w-5" />;
      default:
        return <Paw className="h-5 w-5" />;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        title="Pet Profiles" 
        icon={<Paw size={28} />}
        description="Manage your pets' information and feeding preferences"
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Pets</h2>
        <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Add Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Paw className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium mb-2">No Pets Added Yet</h3>
            <p className="text-gray-500 mb-6">Add your pets to customize their feeding schedules and track their nutrition.</p>
            <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2 mx-auto">
              <PlusCircle className="h-4 w-4" /> Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <Card key={pet.id} className="overflow-hidden">
              <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
                {pet.photoURL ? (
                  <img 
                    src={pet.photoURL} 
                    alt={pet.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {getPetIcon(pet.type)}
                  </div>
                )}
                <Badge className="absolute top-2 right-2 flex items-center gap-1">
                  {getPetIcon(pet.type)} {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{pet.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPet(pet)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pet)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                {pet.breed && <CardDescription>{pet.breed}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2">
                {pet.age && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Age:</span>
                    <span>{pet.age} years</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Weight:</span>
                    <span>{pet.weight} kg</span>
                  </div>
                )}
                {pet.foodType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Food:</span>
                    <span>{pet.foodType}</span>
                  </div>
                )}
                {pet.foodAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Portion:</span>
                    <span>{pet.foodAmount} g</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleEditPet(pet)}>
                  Manage Feeding Schedule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Pet Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
            <DialogDescription>
              Enter your pet's information to create a profile.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="feeding">Feeding Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Fluffy"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Pet Type</Label>
                <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="e.g. Persian"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g. 4.5"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo">Pet Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {formData.photoURL ? (
                      <img 
                        src={formData.photoURL} 
                        alt="Pet preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPetIcon(formData.type)
                    )}
                  </div>
                  <label className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      disabled={uploadingPhoto}
                      asChild
                    >
                      <span>
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" /> Upload Photo
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feeding" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="foodType">Food Type</Label>
                <Input
                  id="foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleInputChange}
                  placeholder="e.g. Dry kibble, Wet food"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="foodAmount">Food Amount (grams)</Label>
                <Input
                  id="foodAmount"
                  name="foodAmount"
                  type="number"
                  value={formData.foodAmount}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedingSchedule">Feeding Schedule</Label>
                <Input
                  id="feedingSchedule"
                  name="feedingSchedule"
                  value={formData.feedingSchedule}
                  onChange={handleInputChange}
                  placeholder="e.g. Twice daily, 8am and 6pm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Special Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special dietary needs or preferences"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setAddDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleAddPet}>
              Add Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pet Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>
              Update your pet's information.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="feeding">Feeding Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Pet Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Pet Type</Label>
                <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="rabbit">Rabbit</SelectItem>
                    <SelectItem value="bird">Bird</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-breed">Breed</Label>
                <Input
                  id="edit-breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age (years)</Label>
                  <Input
                    id="edit-age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Weight (kg)</Label>
                  <Input
                    id="edit-weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-photo">Pet Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                    {formData.photoURL ? (
                      <img 
                        src={formData.photoURL} 
                        alt="Pet preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPetIcon(formData.type)
                    )}
                  </div>
                  <label className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      disabled={uploadingPhoto}
                      asChild
                    >
                      <span>
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" /> Change Photo
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="feeding" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-foodType">Food Type</Label>
                <Input
                  id="edit-foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-foodAmount">Food Amount (grams)</Label>
                <Input
                  id="edit-foodAmount"
                  name="foodAmount"
                  type="number"
                  value={formData.foodAmount}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-feedingSchedule">Feeding Schedule</Label>
                <Input
                  id="edit-feedingSchedule"
                  name="feedingSchedule"
                  value={formData.feedingSchedule}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Special Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditDialogOpen(false); setSelectedPet(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePet}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pet Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedPet?.name} from your pets? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedPet(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePet}>
              Remove Pet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetProfiles; 
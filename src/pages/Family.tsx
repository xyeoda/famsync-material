import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { Plus, ArrowLeft, Trash2, Car } from "lucide-react";
import { AddMemberDialog } from "@/components/Family/AddMemberDialog";
import { FamilyMember } from "@/types/family";
import { useToast } from "@/hooks/use-toast";

const Family = () => {
  const navigate = useNavigate();
  const { members, deleteMember } = useFamilyMembers();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const parents = members.filter(m => m.type === "parent");
  const kids = members.filter(m => m.type === "kid");
  const helpers = members.filter(m => m.type === "helper");

  const handleDelete = (member: FamilyMember) => {
    if (confirm(`Are you sure you want to remove ${member.name} from your family?`)) {
      deleteMember(member.id);
      toast({
        title: "Member removed",
        description: `${member.name} has been removed from your family.`,
      });
    }
  };

  const MemberCard = ({ member }: { member: FamilyMember }) => (
    <Card className="p-6 relative group">
      <Button
        variant="text"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
        onClick={() => handleDelete(member)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <div className="flex flex-col items-center text-center space-y-3">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
          style={{ backgroundColor: `hsl(${member.color})` }}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
        
        <div>
          <h3 className="font-semibold text-lg">{member.name}</h3>
          {member.nickname && (
            <p className="text-sm text-muted-foreground">"{member.nickname}"</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {member.type === "parent" ? "Parent" : member.type === "kid" ? "Child" : "Helper"}
          </span>
          {member.age && (
            <span className="px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary-foreground">
              {member.age} yrs
            </span>
          )}
        </div>

        {member.canDrive && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>Can drive</span>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="text" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Family Tree</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> Family Tree
            </h2>
            <p className="text-muted-foreground mt-1">Manage your household members</p>
          </div>
          <Button variant="filled" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Add Family Member
          </Button>
        </div>

        {/* Parents Section */}
        {parents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Parents</h3>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {parents.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Connection Line */}
        {parents.length > 0 && kids.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-px h-12 bg-primary/30" />
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary">❤️</span>
              </div>
              <div className="w-px h-12 bg-primary/30" />
            </div>
          </div>
        )}

        {/* Children Section */}
        {kids.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Children</h3>
              <div className="flex-1 h-px bg-blue-500/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kids.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Helpers Section */}
        {helpers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Household Help</h3>
              <div className="flex-1 h-px bg-green-500/20" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {helpers.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2">No family members yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first family member to get started with scheduling and coordination
            </p>
            <Button variant="filled" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Family Member
            </Button>
          </Card>
        )}
      </div>

      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
};

export default Family;

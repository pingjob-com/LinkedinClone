import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "@/components/job-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import { getDisplayAddress } from "@/utils/addressUtils";
import AdBanner from "@/components/ads/AdBanner";
import {
  Building,
  Search,
  Users,
  MapPin,
  Globe,
  Briefcase,
  TrendingUp,
  Heart,
  Eye,
  Share,
  Plus,
  Filter,
  Phone,
  Mail,
  Star,
  Check,
  X,
  Edit,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// VendorManagement Component - Restored from working dashboard implementation
function VendorManagement({ companyId }: { companyId: number }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVendorCompany, setSelectedVendorCompany] = useState<any>(null);
  const [vendorComboOpen, setVendorComboOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search companies for vendor selection (all 76,806 companies)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/companies/search', companySearchQuery],
    queryFn: async () => {
      if (!companySearchQuery.trim() || companySearchQuery.length < 2) return [];
      const response = await fetch(`/api/companies/search?query=${encodeURIComponent(companySearchQuery)}&limit=20`);
      if (!response.ok) throw new Error('Failed to search companies');
      return response.json();
    },
    enabled: companySearchQuery.length >= 2
  });

  // Add vendor mutation
  const addVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      return await apiRequest('POST', '/api/vendors', vendorData);
    },
    onSuccess: () => {
      setShowAddForm(false);
      setSelectedVendorCompany(null);
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/details`] });
      toast({
        title: "Vendor added",
        description: "Vendor has been successfully added to the company.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add vendor.",
        variant: "destructive",
      });
    },
  });

  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedVendorCompany) {
      toast({
        title: "Error",
        description: "Please search and select a vendor company.",
        variant: "destructive",
      });
      return;
    }
    
    addVendorMutation.mutate({
      companyId: companyId,
      name: selectedVendorCompany.name,
      email: formData.get('email'),
      phone: formData.get('phone'),
      services: formData.get('services'),
      description: formData.get('description'),
      status: 'active',
    });
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setSelectedVendorCompany(null);
    setCompanySearchQuery("");
    setShowCompanyResults(false);
  };



  if (!showAddForm) {
    return (
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-green-900">Add Vendor to Company</h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCancelForm}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleAddVendor} className="space-y-4">
        {/* Vendor Company Search and Selection */}
        <div className="space-y-2">
          <Label htmlFor="vendor-company">Search Vendor Company</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Type to search companies (e.g., IBM, Microsoft, Google)..."
              value={companySearchQuery}
              onChange={(e) => {
                setCompanySearchQuery(e.target.value);
                setShowCompanyResults(e.target.value.length >= 2);
              }}
              className="w-full"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            
            {/* Search Results Dropdown */}
            {showCompanyResults && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((company: any) => (
                  <div
                    key={company.id}
                    onClick={() => {
                      setSelectedVendorCompany(company);
                      setCompanySearchQuery(company.name);
                      setShowCompanyResults(false);
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{company.name}</div>
                        <div className="text-xs text-gray-500">
                          {company.city && company.state ? `${company.city}, ${company.state}` : company.location}
                        </div>
                        {company.website && (
                          <div className="text-xs text-gray-400">{company.website}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* No Results Message */}
            {showCompanyResults && searchResults && searchResults.length === 0 && !searchLoading && companySearchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="text-sm text-gray-500 text-center">No companies found for "{companySearchQuery}"</div>
              </div>
            )}
            
            {/* Loading State */}
            {searchLoading && showCompanyResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="text-sm text-gray-500 text-center">Searching...</div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Company Preview */}
        {selectedVendorCompany && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Selected Vendor Company</h5>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-blue-500 text-white flex items-center justify-center font-bold">
                {selectedVendorCompany.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedVendorCompany.name}</p>
                {selectedVendorCompany.location && (
                  <p className="text-sm text-gray-600">{selectedVendorCompany.location}</p>
                )}
                {selectedVendorCompany.website && (
                  <p className="text-xs text-gray-500">{selectedVendorCompany.website}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={selectedVendorCompany?.website ? `info@${selectedVendorCompany.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}` : ""}
              placeholder="Enter vendor email"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={selectedVendorCompany?.phone || ""}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        {/* Services */}
        <div className="space-y-2">
          <Label htmlFor="services">Services</Label>
          <Input
            id="services"
            name="services"
            placeholder="e.g., Staffing, Consulting, Development"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Brief description of vendor services"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelForm}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={addVendorMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {addVendorMutation.isPending ? "Adding..." : "Add Vendor"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Company Card Component
function CompanyCard({ company, onSelectCompany, onFollowCompany, onEditCompany }: {
  company: any;
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
  onEditCompany?: (company: any) => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';
  const handleClick = () => {
    console.log("View clicked for company:", company.name);
    onSelectCompany(company);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Company Logo */}
          <div className="w-20 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            {company.logoUrl && company.logoUrl !== "NULL" ? (
              <img 
                src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                alt={company.name}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold text-lg">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Company Name */}
          <h3 className="font-semibold text-base text-gray-900 line-clamp-3 min-h-[60px] flex items-center text-center leading-tight">
            {company.name}
          </h3>
          
          {/* Industry */}
          {company.industry && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {company.industry}
            </p>
          )}
          
          {/* Location with Zip Code */}
          {(company.city || company.state || company.zipCode || company.zip_code || company.country) && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate text-center">
                {[company.city, company.state, company.zipCode || company.zip_code, company.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {/* Stats */}
          <div className="flex flex-col items-center space-y-2 w-full">
            {(company.job_count || 0) > 0 && (
              <div className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="text-sm">{company.job_count} Open Job{company.job_count !== 1 ? 's' : ''}</span>
              </div>
            )}
            {(company.vendor_count || 0) > 0 && (
              <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">{company.vendor_count} Vendor{company.vendor_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="w-full mt-auto space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && onEditCompany && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCompany(company);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Company
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onFollowCompany(company.id);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Heart className="h-4 w-4 mr-2" />
              Follow Company
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Search Results Component
function SearchResults({ companies, onSelectCompany, onFollowCompany, onEditCompany }: {
  companies: any[];
  onSelectCompany: (company: any) => void;
  onFollowCompany: (companyId: number) => void;
  onEditCompany?: (company: any) => void;
}) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No companies found</p>
        <p className="text-sm mt-2">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {companies.map((company: any) => (
        <CompanyCard
          key={company.id}
          company={company}
          onSelectCompany={onSelectCompany}
          onFollowCompany={onFollowCompany}
          onEditCompany={onEditCompany}
        />
      ))}
    </div>
  );
}

// Company Details Modal Component
function CompanyDetailsModal({ company, isOpen, onClose }: {
  company: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: companyDetails } = useQuery({
    queryKey: [`/api/companies/${company?.id}/details`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/companies/${company.id}/details`);
      return response.json();
    },
    enabled: !!company
  });

  // Check if user is admin
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-10 border border-gray-200 rounded overflow-hidden bg-gray-50">
              {company.logoUrl && company.logoUrl !== "NULL" ? (
                <img 
                  src={`/${company.logoUrl.replace(/ /g, '%20')}`} 
                  alt={company.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white font-bold">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Statistics */}
          {(companyDetails?.openJobs?.length > 0 || companyDetails?.vendors?.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Company Activity</h4>
              <div className="flex items-center space-x-6">
                {companyDetails?.openJobs?.length > 0 && (
                  <div className="flex items-center text-green-600">
                    <Briefcase className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {companyDetails.openJobs.length} Open Job{companyDetails.openJobs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {companyDetails?.vendors?.length > 0 && (
                  <div className="flex items-center text-blue-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {companyDetails.vendors.length} Vendor{companyDetails.vendors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Industry</h4>
              <p className="text-gray-600">{company.industry || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Location</h4>
              <p className="text-gray-600">{getDisplayAddress(company) || 'Not specified'}</p>
            </div>
            {company.website && (
              <div>
                <h4 className="font-semibold mb-2">Website</h4>
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-linkedin-blue hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div>
                <h4 className="font-semibold mb-2">Phone</h4>
                <a href={`tel:${company.phone}`} className="text-linkedin-blue hover:underline">
                  {company.phone}
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {company.description && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-gray-700 leading-relaxed">{company.description}</p>
            </div>
          )}

          {/* Tabs for Jobs and Vendors */}
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs">
                Jobs ({companyDetails?.openJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="vendors">
                Vendors ({companyDetails?.vendors?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="space-y-4">
              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div>
                    <h4 className="font-semibold text-blue-900">Admin Actions</h4>
                    <p className="text-sm text-blue-700">Post jobs for this company</p>
                  </div>
                  <Link href={`/job-create?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Post a Job
                    </Button>
                  </Link>
                </div>
              )}
              
              {companyDetails?.openJobs && companyDetails.openJobs.length > 0 ? (
                <div className="space-y-4">
                  {companyDetails.openJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No open positions</p>
                  {isAdmin && (
                    <p className="text-sm mt-2 text-blue-600">Use "Post a Job" above to create the first job for this company</p>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="vendors" className="space-y-4">
              {/* Add Vendor Interface for Admin Users */}
              {isAdmin && <VendorManagement companyId={company.id} />}
              
              {companyDetails?.vendors && companyDetails.vendors.length > 0 ? (
                <div className="space-y-4">
                  {companyDetails.vendors.map((vendor: any) => (
                    <Card key={vendor.vendor_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{vendor.vendor_name}</h4>
                            <p className="text-sm text-gray-600">{vendor.service_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                              {vendor.city && vendor.state && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {vendor.city}, {vendor.state} {vendor.zip_code}
                                </div>
                              )}
                              {vendor.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-4 w-4" />
                                  <a 
                                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-linkedin-blue hover:underline"
                                  >
                                    {vendor.website}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No vendors registered</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Companies Page Component
export default function CompaniesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companyEditOpen, setCompanyEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Check if user is admin
  const isAdmin = user?.email === 'krupas@vedsoft.com' || user?.email === 'krupashankar@gmail.com';
  
  // Get search query from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search') || "";

  const companiesPerPage = 20;
  const totalPages = 5; // 100 companies / 20 per page = 5 pages

  // Load top 100 companies prioritized by vendor and job count
  const { data: topCompanies = [], isLoading } = useQuery({
    queryKey: ['/api/companies/top'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/companies/top');
      return response.json();
    }
  });

  // Fetch platform stats for total company count
  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform/stats'],
    queryFn: async () => {
      const response = await fetch('/api/platform/stats');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    }
  });

  // Search companies when query is provided
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Company edit mutation
  const companyEditMutation = useMutation({
    mutationFn: async (companyData: any) => {
      // If there's a logo file, use FormData for file upload
      if (companyData.logoFile) {
        const formData = new FormData();
        formData.append('logo', companyData.logoFile);
        
        // Add all other company data
        Object.keys(companyData).forEach(key => {
          if (key !== 'logoFile' && companyData[key] !== undefined && companyData[key] !== null) {
            formData.append(key, companyData[key]);
          }
        });
        
        const response = await fetch(`/api/companies/${companyData.id}`, {
          method: 'PATCH',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to update company');
        }
        
        return response.json();
      } else {
        // Regular JSON update without file upload
        const response = await apiRequest('PATCH', `/api/companies/${companyData.id}`, companyData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/top'] });
      queryClient.invalidateQueries({ queryKey: ['/api/search'] });
      setCompanyEditOpen(false);
      setEditingCompany(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company",
        variant: "destructive",
      });
    },
  });

  // Follow company mutation
  const followMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await apiRequest('POST', `/api/companies/${companyId}/follow`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company followed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/top'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow company",
        variant: "destructive",
      });
    },
  });



  // Get current page companies
  const currentCompanies = topCompanies.slice(
    (currentPage - 1) * companiesPerPage,
    currentPage * companiesPerPage
  );

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setCompanyEditOpen(true);
  };

  const handleFollowCompany = (companyId: number) => {
    followMutation.mutate(companyId);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header - Logo Only */}
      <div className="flex items-center mb-8">
        <Link href="/">
          <img 
            src={logoPath} 
            alt="PingJob"
            className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Top Banner Advertisement */}
      <div className="mb-8">
        <AdBanner slot="BANNER_TOP" />
      </div>

      {/* Search Results or Company Grid */}
      {searchQuery && searchQuery.length >= 2 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Search Results for "{searchQuery}"</CardTitle>
              <Button
                onClick={() => window.location.href = '/companies'}
                variant="outline"
                size="sm"
              >
                Clear Search
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SearchResults
              companies={searchResults?.companies || []}
              onSelectCompany={handleSelectCompany}
              onFollowCompany={handleFollowCompany}
              onEditCompany={isAdmin ? handleEditCompany : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Top Companies (76,806 total)
              </CardTitle>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(20)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="w-16 h-12 bg-gray-200 rounded mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : currentCompanies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {currentCompanies.map((company: any) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onSelectCompany={handleSelectCompany}
                      onFollowCompany={handleFollowCompany}
                      onEditCompany={isAdmin ? handleEditCompany : undefined}
                    />
                  ))}
                </div>
                
                {/* Advertisement - Content Middle */}
                <div className="my-8">
                  <AdBanner slot="CONTENT_MIDDLE" />
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-8">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No companies available</h3>
                <p className="text-gray-600">Companies will appear here once they are approved</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Details Modal */}
      <CompanyDetailsModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />

      {/* Company Edit Modal */}
      <Dialog open={companyEditOpen} onOpenChange={setCompanyEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company: {editingCompany?.name}</DialogTitle>
            <DialogDescription>
              Update company information and details
            </DialogDescription>
          </DialogHeader>
          
          {editingCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.name || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.industry || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, industry: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={editingCompany.description || ''}
                  onChange={(e) => setEditingCompany({...editingCompany, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Company Logo</label>
                <div className="mt-1 space-y-2">
                  {editingCompany.logoUrl && editingCompany.logoUrl !== 'logos/NULL' && (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={`/${editingCompany.logoUrl.replace(/ /g, '%20')}`} 
                        alt={`${editingCompany.name} logo`}
                        className="w-12 h-12 object-contain rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-600">Current logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditingCompany({...editingCompany, logoFile: file});
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">Upload a new logo (JPG, PNG, GIF)</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <input
                    type="url"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.website || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, website: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.phone || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.email || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.location || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, location: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Select 
                    value={editingCompany.country || ''} 
                    onValueChange={(value) => setEditingCompany({
                      ...editingCompany, 
                      country: value,
                      state: '', // Reset state when country changes
                      city: '',  // Reset city when country changes
                      zipCode: '' // Reset zip when country changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">State/Province</label>
                  <Select 
                    value={editingCompany.state || ''} 
                    onValueChange={(value) => setEditingCompany({
                      ...editingCompany, 
                      state: value,
                      city: '',  // Reset city when state changes
                      zipCode: '' // Reset zip when state changes
                    })}
                    disabled={!editingCompany.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state/province" />
                    </SelectTrigger>
                    <SelectContent>
                      {editingCompany.country === 'United States' && (
                        <>
                          <SelectItem value="California">California</SelectItem>
                          <SelectItem value="New York">New York</SelectItem>
                          <SelectItem value="Texas">Texas</SelectItem>
                          <SelectItem value="Florida">Florida</SelectItem>
                          <SelectItem value="Illinois">Illinois</SelectItem>
                          <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
                          <SelectItem value="Ohio">Ohio</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="North Carolina">North Carolina</SelectItem>
                          <SelectItem value="Michigan">Michigan</SelectItem>
                          <SelectItem value="New Jersey">New Jersey</SelectItem>
                          <SelectItem value="Virginia">Virginia</SelectItem>
                          <SelectItem value="Washington">Washington</SelectItem>
                          <SelectItem value="Arizona">Arizona</SelectItem>
                          <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                          <SelectItem value="Tennessee">Tennessee</SelectItem>
                          <SelectItem value="Indiana">Indiana</SelectItem>
                          <SelectItem value="Missouri">Missouri</SelectItem>
                          <SelectItem value="Maryland">Maryland</SelectItem>
                          <SelectItem value="Wisconsin">Wisconsin</SelectItem>
                        </>
                      )}
                      {editingCompany.country === 'Canada' && (
                        <>
                          <SelectItem value="Ontario">Ontario</SelectItem>
                          <SelectItem value="Quebec">Quebec</SelectItem>
                          <SelectItem value="British Columbia">British Columbia</SelectItem>
                          <SelectItem value="Alberta">Alberta</SelectItem>
                          <SelectItem value="Manitoba">Manitoba</SelectItem>
                          <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                        </>
                      )}
                      {editingCompany.country === 'United Kingdom' && (
                        <>
                          <SelectItem value="England">England</SelectItem>
                          <SelectItem value="Scotland">Scotland</SelectItem>
                          <SelectItem value="Wales">Wales</SelectItem>
                          <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                        </>
                      )}
                      {editingCompany.country === 'Australia' && (
                        <>
                          <SelectItem value="New South Wales">New South Wales</SelectItem>
                          <SelectItem value="Victoria">Victoria</SelectItem>
                          <SelectItem value="Queensland">Queensland</SelectItem>
                          <SelectItem value="Western Australia">Western Australia</SelectItem>
                          <SelectItem value="South Australia">South Australia</SelectItem>
                          <SelectItem value="Tasmania">Tasmania</SelectItem>
                        </>
                      )}
                      {editingCompany.country && editingCompany.country !== 'United States' && editingCompany.country !== 'Canada' && editingCompany.country !== 'United Kingdom' && editingCompany.country !== 'Australia' && (
                        <SelectItem value="Other">Other</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.city || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, city: e.target.value})}
                    placeholder="Enter city name"
                    disabled={!editingCompany.state}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Zip/Postal Code</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.zipCode || editingCompany.zip_code || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, zipCode: e.target.value})}
                    placeholder="Enter zip/postal code"
                    disabled={!editingCompany.city}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Employee Count</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.employeeCount || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, employeeCount: parseInt(e.target.value) || null})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Founded Year</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingCompany.foundedYear || ''}
                    onChange={(e) => setEditingCompany({...editingCompany, foundedYear: parseInt(e.target.value) || null})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompanyEditOpen(false);
                    setEditingCompany(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => companyEditMutation.mutate(editingCompany)}
                  disabled={companyEditMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {companyEditMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
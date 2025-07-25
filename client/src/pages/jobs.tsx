import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Clock, DollarSign, Users, Filter, SortAsc, Briefcase, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema, type InsertJob, type Company } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import JobApplicationModal from "@/components/modals/job-application-modal";
import { Link } from "wouter";
import logoPath from "@assets/logo_1749581218265.png";
import AdBanner from "@/components/ads/AdBanner";

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    search: ""
  });

  // Read search parameter from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam
      }));
    }
  }, []);

  // Fetch both admin and recruiter jobs for search
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/all-jobs', filters],
    queryFn: async () => {
      try {
        // Fetch both admin and recruiter jobs
        const [adminJobsResponse, recruiterJobsResponse] = await Promise.all([
          fetch('/api/admin-jobs?limit=50'),
          fetch('/api/recruiter-jobs?limit=50')
        ]);

        if (!adminJobsResponse.ok || !recruiterJobsResponse.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const adminJobs = await adminJobsResponse.json();
        const recruiterJobs = await recruiterJobsResponse.json();
        
        // Combine and filter jobs based on search
        const allJobs = [...adminJobs, ...recruiterJobs];
        
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.toLowerCase();
          return allJobs.filter(job => 
            job.title?.toLowerCase().includes(searchTerm) ||
            job.description?.toLowerCase().includes(searchTerm) ||
            job.company?.name?.toLowerCase().includes(searchTerm) ||
            job.location?.toLowerCase().includes(searchTerm)
          );
        }
        
        return allJobs;
      } catch (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }
    },
    enabled: true
  });

  // Fetch companies for job creation
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies', { search: companySearch }],
    enabled: companySearch.length >= 2 || companySearch === ""
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  // Job form
  const jobForm = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      location: "",
      country: "",
      state: "",
      city: "",
      zipCode: "",
      salary: "",
      employmentType: "full_time",
      experienceLevel: "mid",
      categoryId: 1,
      companyId: 1,
      skills: ""
    }
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (jobData: InsertJob) => apiRequest('POST', '/api/jobs', jobData),
    onSuccess: () => {
      toast({
        title: "Job created successfully",
        description: "The job posting has been created"
      });
      setIsAddJobOpen(false);
      jobForm.reset();
      setSelectedCompany(null);
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating job",
        description: error.message || "Failed to create job posting",
        variant: "destructive"
      });
    }
  });

  const clearFilters = () => {
    setFilters({
      search: "",
      jobType: "all",
      experienceLevel: "all",
      location: "",
      industry: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo Header */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <img 
            src={logoPath} 
            alt="PingJob Logo" 
            className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
      
      {/* Top Banner Advertisement */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AdBanner slot="BANNER_TOP" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            
            {/* Admin Actions */}
            {user?.userType === 'admin' && (
              <Card>
                <CardContent className="p-6">
                  <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Job</DialogTitle>
                      </DialogHeader>
                      <Form {...jobForm}>
                        <form onSubmit={jobForm.handleSubmit((data) => {
                          if (!selectedCompany) {
                            toast({
                              title: "Company required",
                              description: "Please select a company for this job",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          const jobData = {
                            ...data,
                            companyId: selectedCompany.id
                          };
                          
                          createJobMutation.mutate(jobData);
                        })} className="space-y-4">
                          
                          {/* Company Selection */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Company *
                            </label>
                            <Input
                              placeholder="Type company name to search..."
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                            />
                            {companySearch.length >= 2 && (
                              <div className="max-h-48 overflow-auto border rounded-md bg-white mt-2">
                                {companiesLoading ? (
                                  <div className="p-3 text-sm text-gray-500">Searching...</div>
                                ) : companies.length > 0 ? (
                                  companies.map((company: any) => (
                                    <div
                                      key={company.id}
                                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                      onClick={() => {
                                        setSelectedCompany(company);
                                        setCompanySearch(company.name);
                                      }}
                                    >
                                      <div className="font-medium">{company.name}</div>
                                      <div className="text-sm text-gray-600">{company.industry}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 text-sm text-gray-500">No companies found</div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Job Title */}
                          <FormField
                            control={jobForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Job Description */}
                          <FormField
                            control={jobForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter job description"
                                    className="min-h-[120px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Form Actions */}
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddJobOpen(false);
                                jobForm.reset();
                                setSelectedCompany(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createJobMutation.isPending}
                              className="bg-linkedin-blue hover:bg-linkedin-dark"
                            >
                              {createJobMutation.isPending ? "Creating..." : "Create Job"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            {/* Active Filters */}
            {Object.values(filters).some(Boolean) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary">
                        Search: {filters.search}
                      </Badge>
                    )}
                    {filters.jobType && (
                      <Badge variant="secondary">
                        Type: {filters.jobType.replace('_', ' ')}
                      </Badge>
                    )}
                    {filters.experienceLevel && (
                      <Badge variant="secondary">
                        Level: {filters.experienceLevel}
                      </Badge>
                    )}
                    {filters.location && (
                      <Badge variant="secondary">
                        Location: {filters.location}
                      </Badge>
                    )}
                    {filters.industry && (
                      <Badge variant="secondary">
                        Industry: {filters.industry}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {filters.search ? `Jobs matching "${filters.search}"` : 'All Jobs'}
                </h1>
                <p className="text-gray-600">
                  {isLoading ? 'Loading...' : `${jobs?.length || 0} jobs found`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select defaultValue="newest">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Listings */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600">
                      Try adjusting your filters or search terms to find more jobs.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {jobs.map((job: any, index: number) => (
                    <div key={`job-${job.id}-${index}`}>
                      {/* Insert ad after every 5th job */}
                      {index > 0 && index % 5 === 0 && (
                        <div className="my-6">
                          <AdBanner slot="CONTENT_MIDDLE" />
                        </div>
                      )}
                      <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                            {job.company?.logoUrl && job.company.logoUrl !== "NULL" ? (
                              <img 
                                src={`/${job.company.logoUrl.replace(/ /g, '%20')}`} 
                                alt={job.company.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-linkedin-blue text-white">
                                <Building2 className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-linkedin-blue font-medium mb-2">
                              {job.company?.name || 'Company Name'}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location || `${job.city}, ${job.state}`}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {job.employmentType?.replace('_', ' ') || 'Full time'}
                              </div>
                              {job.salary && (
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {job.salary}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {job.experienceLevel || 'Mid level'}
                              </div>
                            </div>
                            
                            <div className="text-gray-700 text-sm mb-3">
                              <p className="mb-2">{job.description}</p>
                              {job.requirements && (
                                <div>
                                  <strong className="text-gray-900">Requirements:</strong>
                                  <p className="mt-1">{job.requirements}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {job.category?.name || 'Technology'}
                              </Badge>
                              {job.skills && Array.isArray(job.skills) && job.skills.slice(0, 3).map((skill: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <span className="text-xs text-gray-500">
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex flex-col space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-linkedin-blue hover:bg-linkedin-dark"
                              onClick={() => setSelectedJob(job)}
                            >
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </div>
                      </CardContent>
                      </Card>
                    </div>
                  ))}
                </>
              )}
            </div>
        </div>
      </div>
      
      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplicationModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
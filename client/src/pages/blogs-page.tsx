import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BlogSidebar } from "@/components/blog-sidebar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import SEO from "@/components/seo";

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("BlogsPage mounted successfully");
  }, []);

  const blogs = [
    {
      title: "Essential Tips for Urban Cycling",
      date: "February 15, 2025",
      author: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
      excerpt: "Discover how to navigate city streets safely and efficiently with our comprehensive guide to urban cycling.",
      content: `Urban cycling has become increasingly popular as more people seek sustainable transportation options. 
      Here are some essential tips for staying safe and comfortable while cycling in the city:

      1. Always wear a helmet and use proper lighting
      2. Stay visible with reflective gear
      3. Follow traffic rules and use hand signals
      4. Plan your route using bike-friendly streets
      5. Maintain your bicycle regularly

      Remember, confidence comes with practice. Start with quieter streets and gradually work your way up to busier routes.`
    },
    {
      title: "Choosing Your First Mountain Bike",
      date: "February 18, 2025",
      author: "Mike Stevens",
      image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80",
      excerpt: "A comprehensive guide to selecting the perfect mountain bike for beginners.",
      content: `Selecting your first mountain bike can be overwhelming with so many options available. 
      Here's what to consider when making your choice:

      1. Frame Material: Aluminum is great for beginners - lightweight and affordable
      2. Wheel Size: 29ers offer better stability, while 27.5" provides more maneuverability
      3. Suspension: Hardtail bikes are perfect for beginners and trail riding
      4. Budget: Invest in quality components that matter most
      5. Fit: Proper sizing is crucial for comfort and control

      Remember to test ride different bikes before making your final decision. A good bike shop will help you find the perfect fit.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cycling Blog - Pling! | Expert Tips & Guides"
        description="Read our latest articles about cycling, maintenance tips, and cycling culture. Expert advice for both beginners and advanced riders."
        canonicalUrl="/blogs"
        type="article"
      />

      <Navbar />

      {/* Visual confirmation header */}
      <div className="bg-primary/10 py-2 text-center">
        <p className="text-sm text-primary">Blog Page Loaded Successfully</p>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Cycling Blog</h1>
          <p className="text-xl text-muted-foreground">
            Expert insights, maintenance tips, and cycling adventures
          </p>
        </div>

        {/* Search Header */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <BlogSidebar />
          </aside>

          {/* Blog Grid */}
          <div className="flex-1">
            <div className="grid gap-8 md:grid-cols-2">
              {blogs.map((blog, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="text-sm text-muted-foreground">
                      {blog.date} • By {blog.author}
                    </div>
                    <CardTitle className="text-2xl">{blog.title}</CardTitle>
                    <CardDescription>{blog.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray">
                      {blog.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
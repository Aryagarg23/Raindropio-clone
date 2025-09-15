"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Share2, Settings, Users, ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: "owner" | "admin" | "member"
}

interface Collection {
  id: string
  name: string
  description: string
  bookmarkCount: number
  isPublic: boolean
  color: string
  parentId?: string
  children?: Collection[]
}

interface TeamBookmark {
  id: string
  title: string
  url: string
  description: string
  image?: string
  tags: string[]
  collectionId: string
  createdAt: string
  createdBy: string
}

export default function TeamSitePage() {
  const params = useParams()
  const teamId = params.teamId as string

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Mock data - in real app, this would come from API/WebSocket
  const [teamData] = useState({
    id: teamId,
    name: "Design Team",
    description: "Curating the best design resources and inspiration",
    memberCount: 12,
    bookmarkCount: 247,
    collectionCount: 8,
  })

  const [members] = useState<TeamMember[]>([
    { id: "1", name: "Sarah Chen", email: "sarah@company.com", role: "owner", avatar: "/woman-designer.png" },
    { id: "2", name: "Alex Rivera", email: "alex@company.com", role: "admin", avatar: "/man-developer.png" },
    { id: "3", name: "Maya Patel", email: "maya@company.com", role: "member", avatar: "/woman-ux.jpg" },
    { id: "4", name: "Jordan Kim", email: "jordan@company.com", role: "member", avatar: "/person-creative.jpg" },
  ])

  const [collections] = useState<Collection[]>([
    {
      id: "1",
      name: "UI Inspiration",
      description: "Beautiful interface designs",
      bookmarkCount: 45,
      isPublic: true,
      color: "bg-blue-500",
      children: [
        {
          id: "1-1",
          name: "Mobile UI",
          description: "Mobile interface designs",
          bookmarkCount: 20,
          isPublic: true,
          color: "bg-blue-400",
          parentId: "1",
        },
        {
          id: "1-2",
          name: "Web UI",
          description: "Web interface designs",
          bookmarkCount: 25,
          isPublic: true,
          color: "bg-blue-600",
          parentId: "1",
        },
      ],
    },
    {
      id: "2",
      name: "Typography",
      description: "Font pairings and type systems",
      bookmarkCount: 32,
      isPublic: true,
      color: "bg-purple-500",
      children: [
        {
          id: "2-1",
          name: "Font Pairs",
          description: "Beautiful font combinations",
          bookmarkCount: 15,
          isPublic: true,
          color: "bg-purple-400",
          parentId: "2",
        },
      ],
    },
    {
      id: "3",
      name: "Color Palettes",
      description: "Curated color schemes",
      bookmarkCount: 28,
      isPublic: false,
      color: "bg-green-500",
    },
    {
      id: "4",
      name: "Tools & Resources",
      description: "Design tools and utilities",
      bookmarkCount: 67,
      isPublic: true,
      color: "bg-orange-500",
    },
  ])

  const [bookmarks] = useState<TeamBookmark[]>([
    {
      id: "1",
      title: "Dribbble - Discover the World's Top Designers",
      url: "https://dribbble.com",
      description: "Find inspiration from the world's top designers",
      image: "/dribbble-design-portfolio.jpg",
      tags: ["design", "inspiration", "portfolio"],
      collectionId: "1",
      createdAt: "2024-01-15",
      createdBy: "Sarah Chen",
    },
    {
      id: "2",
      title: "Figma: The Collaborative Interface Design Tool",
      url: "https://figma.com",
      description: "Design, prototype, and collaborate in real-time",
      image: "/figma-design-tool.jpg",
      tags: ["design", "tool", "collaboration"],
      collectionId: "4",
      createdAt: "2024-01-14",
      createdBy: "Alex Rivera",
    },
    {
      id: "3",
      title: "Google Fonts",
      url: "https://fonts.google.com",
      description: "Free and open source font families",
      image: "/google-fonts-typography.jpg",
      tags: ["typography", "fonts", "free"],
      collectionId: "2",
      createdAt: "2024-01-13",
      createdBy: "Maya Patel",
    },
    {
      id: "4",
      title: "Coolors - Color Palette Generator",
      url: "https://coolors.co",
      description: "Generate beautiful color palettes",
      image: "/color-palette-generator.png",
      tags: ["color", "palette", "generator"],
      collectionId: "3",
      createdAt: "2024-01-12",
      createdBy: "Jordan Kim",
    },
  ])

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  const renderCollectionTree = (collections: Collection[], level = 0) => {
    return collections.map((collection) => (
      <div key={collection.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
            selectedCollectionId === collection.id ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedCollectionId(collection.id)}
        >
          {collection.children && collection.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleCollection(collection.id)
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {expandedCollections.has(collection.id) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {expandedCollections.has(collection.id) ? (
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Folder className="w-4 h-4 text-muted-foreground" />
          )}

          <div className={`w-2 h-2 rounded-full ${collection.color}`} />
          <span className="text-sm font-medium truncate">{collection.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{collection.bookmarkCount}</span>
        </div>

        {collection.children && expandedCollections.has(collection.id) && (
          <div>{renderCollectionTree(collection.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  const displayedBookmarks = selectedCollectionId
    ? filteredBookmarks.filter((bookmark) => bookmark.collectionId === selectedCollectionId)
    : filteredBookmarks

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-balance">{teamData.name}</h1>
                <p className="text-sm text-muted-foreground">{teamData.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {teamData.memberCount} members
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {teamData.bookmarkCount} bookmarks
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {teamData.collectionCount} collections
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === "collections" ? "Add Collection" : "Add Bookmark"}
              </Button>
            </div>
          </div>

          <TabsContent value="main" className="space-y-6">
            <div className="flex gap-6">
              {/* Sidebar with collections */}
              <div className="w-64 flex-shrink-0">
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Collections</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1">
                    <div
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedCollectionId === null ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedCollectionId(null)}
                    >
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">All Bookmarks</span>
                      <span className="text-xs text-muted-foreground ml-auto">{bookmarks.length}</span>
                    </div>
                    {renderCollectionTree(collections)}
                  </CardContent>
                </Card>
              </div>

              {/* Main content area */}
              <div className="flex-1">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedBookmarks.map((bookmark) => (
                      <Card
                        key={bookmark.id}
                        className="group hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={bookmark.image || "/placeholder.svg"}
                            alt={bookmark.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                              {/* MoreHorizontal icon here */}
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm line-clamp-2 text-balance mb-2">{bookmark.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{bookmark.description}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bookmark.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{bookmark.createdBy}</span>
                            <div className="flex items-center gap-2">
                              {/* Heart icon button here */}
                              {/* ExternalLink icon button here */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedBookmarks.map((bookmark) => (
                      <Card key={bookmark.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={bookmark.image || "/placeholder.svg"}
                              alt={bookmark.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate text-balance">{bookmark.title}</h3>
                              <p className="text-xs text-muted-foreground truncate">{bookmark.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {bookmark.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{bookmark.createdBy}</span>
                              {/* MoreHorizontal icon button here */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${collection.color}`} />
                        <CardTitle className="text-base text-balance">{collection.name}</CardTitle>
                      </div>
                      {collection.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{collection.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{collection.bookmarkCount} bookmarks</span>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-balance">{member.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant={member.role === "owner" ? "default" : "secondary"} className="text-xs capitalize">
                        {member.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

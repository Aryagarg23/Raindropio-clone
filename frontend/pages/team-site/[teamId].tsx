"use client"

import { useState } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useTeamSite } from "../../hooks/useTeamSite"
import { Search, Plus, Share2, Settings, Users, ChevronDown, ChevronRight, Folder, FolderOpen, Grid3X3, List, ExternalLink, Heart } from "lucide-react"

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_at: string
  created_by: string
  profiles?: {
    user_id: string
    full_name?: string
    avatar_url?: string
  }
  bookmarkCount?: number
  children?: ExtendedCollection[]
  parentId?: string
}

export default function TeamSitePage() {
  const router = useRouter()
  const { teamId } = router.query
  
  const {
    user,
    profile,
    loading,
    error,
    collections,
    bookmarks,
    teamEvents,
    presence,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError
  } = useTeamSite(teamId)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [showAddBookmark, setShowAddBookmark] = useState(false)

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const renderCollectionTree = (collections: any[], level = 0) => {
    return collections.map((collection) => {
      const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length
      
      return (
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

            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: collection.color }}
            />
            <span className="text-sm font-medium truncate">{collection.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{bookmarkCount}</span>
          </div>

          {collection.children && expandedCollections.has(collection.id) && (
            <div>{renderCollectionTree(collection.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  const displayedBookmarks = selectedCollectionId
    ? filteredBookmarks.filter((bookmark) => bookmark.collection_id === selectedCollectionId)
    : filteredBookmarks

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading team workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive text-xl mb-4">⚠️ {error}</div>
          <Button onClick={() => router.push('/admin')}>
            Back to Admin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin')}
                className="mr-2"
              >
                ← Back to Dashboard
              </Button>
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Team Workspace</h1>
                <p className="text-sm text-muted-foreground">Collaborative bookmark management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online members */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {presence.length === 0 ? 'No one online' : `${presence.length} online`}
                  </span>
                </div>
                
                {presence.length > 0 && (
                  <div className="flex -space-x-2">
                    {presence.slice(0, 5).map((p: any) => {
                      const displayName = p.profiles?.full_name || p.profiles?.user_id || 'Unknown User'
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                      
                      return (
                        <div
                          key={p.user_id}
                          className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-semibold bg-primary text-primary-foreground"
                          title={`${displayName} (Online)`}
                        >
                          {p.profiles?.avatar_url ? (
                            <img 
                              src={p.profiles.avatar_url} 
                              alt={displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

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
              {presence.length} members online
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              {bookmarks.length} bookmarks
            </div>
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              {collections.length} collections
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
              <TabsTrigger value="activity">Activity</TabsTrigger>
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
              {activeTab === "main" && (
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button size="sm" onClick={() => {
                if (activeTab === "collections") {
                  setShowCreateCollection(true)
                } else {
                  setShowAddBookmark(true)
                }
              }}>
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
                            src={bookmark.preview_image || "/placeholder.svg"}
                            alt={bookmark.title || bookmark.url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm line-clamp-2 mb-2">
                            {bookmark.title || bookmark.url}
                          </h3>
                          {bookmark.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {bookmark.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bookmark.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Heart className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
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
                              src={bookmark.preview_image || "/placeholder.svg"}
                              alt={bookmark.title || bookmark.url}
                              className="w-16 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">
                                {bookmark.title || bookmark.url}
                              </h3>
                              {bookmark.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {bookmark.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {(bookmark as any).profiles?.full_name || 'Unknown'}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(bookmark.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {displayedBookmarks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔖</div>
                    <h3 className="text-xl font-semibold mb-2">No bookmarks found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? 'Try adjusting your search' : 'Start saving useful links for your team'}
                    </p>
                    <Button onClick={() => setShowAddBookmark(true)}>
                      Add Bookmark
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="group hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={bookmark.preview_image || "/placeholder.svg"}
                      alt={bookmark.title || bookmark.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                      {bookmark.title || bookmark.url}
                    </h3>
                    {bookmark.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {bookmark.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: collection.color }}
                        />
                        <Folder className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                        {bookmarks.filter(b => b.collection_id === collection.id).length} items
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{collection.name}</h3>
                    
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(collection.created_at).toLocaleDateString()}
                      </div>
                      {(collection as any).profiles && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-semibold">
                            {(collection as any).profiles.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="space-y-4">
              {teamEvents.map((event) => {
                const getEventIcon = (eventType: string) => {
                  switch (eventType) {
                    case 'collection.created': return '📁'
                    case 'bookmark.created': return '🔖'
                    case 'highlight.created': return '✨'
                    case 'annotation.created': return '💬'
                    default: return '📝'
                  }
                }
                
                const getEventDescription = (eventType: string, data: any) => {
                  switch (eventType) {
                    case 'collection.created':
                      return `created collection "${data?.collection_name || 'Untitled'}"`
                    case 'bookmark.created':
                      return `added bookmark "${data?.bookmark_title || data?.bookmark_url || 'Untitled'}"`
                    case 'highlight.created':
                      return `highlighted text`
                    case 'annotation.created':
                      return `added annotation`
                    default:
                      return eventType.replace('.', ' ').replace('_', ' ')
                  }
                }

                return (
                  <Card key={event.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {((event as any).profiles?.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="text-xl">
                            {getEventIcon(event.event_type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium mb-1">
                            <span className="font-bold">
                              {(event as any).profiles?.full_name || 'Unknown User'}
                            </span>
                            {' '}
                            {getEventDescription(event.event_type, event.data)}
                          </p>
                          
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {teamEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Team activity will appear here as members create collections and bookmarks
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Collection Modal - You'll need to implement these modals */}
      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onCreate={createCollection}
        />
      )}

      {/* Add Bookmark Modal */}
      {showAddBookmark && (
        <AddBookmarkModal
          collections={collections}
          onClose={() => setShowAddBookmark(false)}
          onCreate={createBookmark}
        />
      )}
    </div>
  )
}

// Modal Components - keeping the existing ones from your original code
function CreateCollectionModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void;
  onCreate: (name: string, description?: string, color?: string) => void;
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#A0D2EB')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined, color)
    }
  }

  const colorOptions = [
    '#A0D2EB', '#E57373', '#C41230', '#81C784', '#FFB74D', 
    '#BA68C8', '#4FC3F7', '#FF8A65', '#9CCC65', '#F06292'
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Collection Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter collection name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Optional description"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Collection Color</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded border-2 ${color === colorOption ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Collection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AddBookmarkModal({ 
  collections,
  onClose, 
  onCreate 
}: { 
  collections: any[];
  onClose: () => void;
  onCreate: (url: string, title?: string, collectionId?: string) => void;
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onCreate(url.trim(), title.trim() || undefined, collectionId || undefined)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Bookmark</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Collection</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    📁 {collection.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Bookmark
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
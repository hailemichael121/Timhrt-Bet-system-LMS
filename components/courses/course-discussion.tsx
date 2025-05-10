"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Send, ThumbsUp, Reply, Flag, Bookmark, Search, Filter } from "lucide-react"

interface DiscussionProps {
  courseId: string
}

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  author_id: string
  author: {
    first_name: string
    last_name: string
    avatar_url: string
    role: string
  }
  likes: number
  replies: number
  liked_by_me: boolean
  tags: string[]
}

interface ReplyType {
  id: string
  content: string
  created_at: string
  author_id: string
  author: {
    first_name: string
    last_name: string
    avatar_url: string
    role: string
  }
  likes: number
  liked_by_me: boolean
}

export function CourseDiscussion({ courseId }: DiscussionProps) {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<ReplyType[]>([])
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newReplyContent, setNewReplyContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [submitting, setSubmitting] = useState(false)
  const repliesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPosts()
  }, [courseId])

  useEffect(() => {
    if (selectedPost) {
      fetchReplies(selectedPost.id)
    }
  }, [selectedPost])

  useEffect(() => {
    if (repliesEndRef.current) {
      repliesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [replies])

  const fetchPosts = async () => {
    try {
      setLoading(true)

      // In a real app, you would have a discussion_posts table
      // For now, we'll generate mock data
      const mockPosts: Post[] = [
        {
          id: "1",
          title: "Question about Assignment 2",
          content: "I'm having trouble understanding the requirements for question 3. Can someone clarify?",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          author_id: "1",
          author: {
            first_name: "Jane",
            last_name: "Doe",
            avatar_url: "",
            role: "student",
          },
          likes: 5,
          replies: 3,
          liked_by_me: false,
          tags: ["assignment", "help"],
        },
        {
          id: "2",
          title: "Study Group for Midterm",
          content:
            "Would anyone be interested in forming a study group for the upcoming midterm? We could meet in the library.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
          author_id: "2",
          author: {
            first_name: "John",
            last_name: "Smith",
            avatar_url: "",
            role: "student",
          },
          likes: 8,
          replies: 6,
          liked_by_me: true,
          tags: ["study group", "midterm"],
        },
        {
          id: "3",
          title: "Additional Resources for Chapter 5",
          content:
            "I've compiled some additional resources that might help with understanding the concepts in Chapter 5. Let me know if you find them useful!",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          author_id: "3",
          author: {
            first_name: "Professor",
            last_name: "Johnson",
            avatar_url: "",
            role: "teacher",
          },
          likes: 12,
          replies: 4,
          liked_by_me: false,
          tags: ["resources", "chapter 5"],
        },
      ]

      setPosts(mockPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to load discussion posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReplies = async (postId: string) => {
    try {
      setLoading(true)

      // In a real app, you would have a discussion_replies table
      // For now, we'll generate mock data
      const mockReplies: ReplyType[] = [
        {
          id: "1",
          content:
            "Question 3 is asking about the implementation of the algorithm discussed in class. You need to analyze its time complexity.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
          author_id: "3",
          author: {
            first_name: "Professor",
            last_name: "Johnson",
            avatar_url: "",
            role: "teacher",
          },
          likes: 3,
          liked_by_me: true,
        },
        {
          id: "2",
          content: "I was confused about that too! Thanks for the clarification.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20 hours ago
          author_id: "4",
          author: {
            first_name: "Emily",
            last_name: "Wilson",
            avatar_url: "",
            role: "student",
          },
          likes: 1,
          liked_by_me: false,
        },
        {
          id: "3",
          content:
            "Also, don't forget to reference the textbook examples on page 127-129. They're really helpful for this question.",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
          author_id: "5",
          author: {
            first_name: "Michael",
            last_name: "Brown",
            avatar_url: "",
            role: "student",
          },
          likes: 2,
          liked_by_me: false,
        },
      ]

      setReplies(mockReplies)
    } catch (error) {
      console.error("Error fetching replies:", error)
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and content for your post",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // In a real app, you would insert into the discussion_posts table
      // For now, we'll just add to the local state
      const newPost: Post = {
        id: Date.now().toString(),
        title: newPostTitle,
        content: newPostContent,
        created_at: new Date().toISOString(),
        author_id: user?.id || "",
        author: {
          first_name: user?.profile?.first_name || "",
          last_name: user?.profile?.last_name || "",
          avatar_url: user?.profile?.avatar_url || "",
          role: user?.profile?.role || "student",
        },
        likes: 0,
        replies: 0,
        liked_by_me: false,
        tags: [],
      }

      setPosts([newPost, ...posts])
      setNewPostTitle("")
      setNewPostContent("")

      toast({
        title: "Success",
        description: "Your post has been created",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReply = async () => {
    if (!selectedPost || !newReplyContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide content for your reply",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // In a real app, you would insert into the discussion_replies table
      // For now, we'll just add to the local state
      const newReply: ReplyType = {
        id: Date.now().toString(),
        content: newReplyContent,
        created_at: new Date().toISOString(),
        author_id: user?.id || "",
        author: {
          first_name: user?.profile?.first_name || "",
          last_name: user?.profile?.last_name || "",
          avatar_url: user?.profile?.avatar_url || "",
          role: user?.profile?.role || "student",
        },
        likes: 0,
        liked_by_me: false,
      }

      setReplies([...replies, newReply])

      // Update the post's reply count
      setPosts(posts.map((post) => (post.id === selectedPost.id ? { ...post, replies: post.replies + 1 } : post)))

      setNewReplyContent("")

      toast({
        title: "Success",
        description: "Your reply has been posted",
      })
    } catch (error) {
      console.error("Error creating reply:", error)
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: post.liked_by_me ? post.likes - 1 : post.likes + 1,
              liked_by_me: !post.liked_by_me,
            }
          : post,
      ),
    )
  }

  const handleLikeReply = (replyId: string) => {
    setReplies(
      replies.map((reply) =>
        reply.id === replyId
          ? {
              ...reply,
              likes: reply.liked_by_me ? reply.likes - 1 : reply.likes + 1,
              liked_by_me: !reply.liked_by_me,
            }
          : reply,
      ),
    )
  }

  const filteredPosts = posts
    .filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((post) => {
      if (filter === "all") return true
      if (filter === "teacher" && post.author.role === "teacher") return true
      if (filter === "student" && post.author.role === "student") return true
      if (filter === "my-posts" && post.author_id === user?.id) return true
      return false
    })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Course Discussion</CardTitle>
        <CardDescription>Engage with your classmates and instructors</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="forum" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forum">Discussion Forum</TabsTrigger>
            <TabsTrigger value="create">Create Post</TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="p-4 space-y-4">
            {selectedPost ? (
              <div className="space-y-4">
                <Button variant="ghost" className="mb-2" onClick={() => setSelectedPost(null)}>
                  ← Back to all posts
                </Button>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedPost.title}</CardTitle>
                        <CardDescription>
                          Posted {formatDistanceToNow(new Date(selectedPost.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedPost.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={selectedPost.author.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {getInitials(selectedPost.author.first_name, selectedPost.author.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {selectedPost.author.first_name} {selectedPost.author.last_name}
                          </span>
                          <Badge variant="outline">{selectedPost.author.role}</Badge>
                        </div>
                        <p className="text-muted-foreground">{selectedPost.content}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={selectedPost.liked_by_me ? "text-primary" : ""}
                        onClick={() => handleLikePost(selectedPost.id)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        <span>{selectedPost.likes} Likes</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span>{selectedPost.replies} Replies</span>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4 mr-2" />
                        <span>Save</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Flag className="h-4 w-4 mr-2" />
                        <span>Report</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Replies</h3>

                  {replies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No replies yet. Be the first to reply!</p>
                  ) : (
                    <AnimatePresence>
                      {replies.map((reply) => (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-4">
                                <Avatar>
                                  <AvatarImage src={reply.author.avatar_url || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {getInitials(reply.author.first_name, reply.author.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {reply.author.first_name} {reply.author.last_name}
                                      </span>
                                      <Badge variant="outline">{reply.author.role}</Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground">{reply.content}</p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <div className="flex gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={reply.liked_by_me ? "text-primary" : ""}
                                  onClick={() => handleLikeReply(reply.id)}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-2" />
                                  <span>{reply.likes} Likes</span>
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Reply className="h-4 w-4 mr-2" />
                                  <span>Reply</span>
                                </Button>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Flag className="h-4 w-4 mr-2" />
                                <span>Report</span>
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  <div ref={repliesEndRef} />

                  <Card>
                    <CardHeader>
                      <CardTitle>Add a Reply</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Write your reply here..."
                        value={newReplyContent}
                        onChange={(e) => setNewReplyContent(e.target.value)}
                        className="min-h-32"
                      />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button onClick={handleCreateReply} disabled={submitting || !newReplyContent.trim()}>
                        {submitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            <span>Post Reply</span>
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search discussions..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      className="border rounded p-2 text-sm"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Posts</option>
                      <option value="teacher">Instructor Posts</option>
                      <option value="student">Student Posts</option>
                      <option value="my-posts">My Posts</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading discussions..." />
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                    <p className="text-muted-foreground">No discussions found</p>
                    <p className="text-sm text-muted-foreground">
                      Start a new discussion to get the conversation going!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedPost(post)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{post.title}</CardTitle>
                              <div className="flex gap-2">
                                {post.tags.map((tag) => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <CardDescription>
                              Posted by {post.author.first_name} {post.author.last_name} ({post.author.role}){" "}
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground line-clamp-2">{post.content}</p>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <div className="flex gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={post.liked_by_me ? "text-primary" : ""}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLikePost(post.id)
                                }}
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                <span>{post.likes} Likes</span>
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                <span>{post.replies} Replies</span>
                              </Button>
                            </div>
                            <Button variant="outline" size="sm">
                              View Discussion
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Discussion</CardTitle>
                <CardDescription>Share your thoughts, questions, or insights with the class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="post-title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="post-title"
                    placeholder="Enter a descriptive title for your post"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="post-content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="post-content"
                    placeholder="Write your post here..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-32"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleCreatePost}
                  disabled={submitting || !newPostTitle.trim() || !newPostContent.trim()}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span>Creating Post...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>Create Post</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

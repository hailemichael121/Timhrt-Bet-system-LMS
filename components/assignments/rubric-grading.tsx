"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { AlertCircle, Plus, Trash2, Save, CheckCircle, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "@/components/ui/use-toast"

interface RubricCriteria {
  id: string
  name: string
  description: string
  points: number
  levels: {
    id: string
    name: string
    description: string
    points: number
  }[]
}

interface RubricProps {
  assignmentId?: string
  submissionId?: string
  studentId?: string
  readOnly?: boolean
  onGradeSubmit?: (totalPoints: number, feedback: string) => void
}

export function RubricGrading({ assignmentId, submissionId, studentId, readOnly = false, onGradeSubmit }: RubricProps) {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rubrics, setRubrics] = useState<any[]>([])
  const [selectedRubric, setSelectedRubric] = useState<any | null>(null)
  const [criteriaEvaluations, setCriteriaEvaluations] = useState<Record<string, string>>({})
  const [totalPoints, setTotalPoints] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [newRubricName, setNewRubricName] = useState("")

  // New rubric template creation
  const [editingRubric, setEditingRubric] = useState<{
    name: string
    description: string
    criteria: RubricCriteria[]
  }>({
    name: "",
    description: "",
    criteria: [],
  })

  useEffect(() => {
    if (user) {
      fetchRubrics()
    }
  }, [user, assignmentId])

  useEffect(() => {
    if (selectedRubric) {
      // Initialize criteria evaluations
      const initialEvaluations: Record<string, string> = {}
      selectedRubric.criteria.forEach((criterion: RubricCriteria) => {
        initialEvaluations[criterion.id] = ""
      })
      setCriteriaEvaluations(initialEvaluations)
    }
  }, [selectedRubric])

  useEffect(() => {
    calculateTotalPoints()
  }, [criteriaEvaluations, selectedRubric])

  const fetchRubrics = async () => {
    try {
      setLoading(true)

      // Get teacher's rubrics
      const { data, error } = await supabase
        .from("rubrics")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setRubrics(data || [])

      // If we have an assignment ID, check if there's a specific rubric for it
      if (assignmentId) {
        const { data: assignmentRubric, error: assignmentError } = await supabase
          .from("assignment_rubrics")
          .select("rubric_id")
          .eq("assignment_id", assignmentId)
          .single()

        if (!assignmentError && assignmentRubric) {
          const matchingRubric = data?.find((r) => r.id === assignmentRubric.rubric_id) || null
          setSelectedRubric(matchingRubric)
        } else if (data && data.length > 0) {
          // Default to first rubric if no specific one is assigned
          setSelectedRubric(data[0])
        }
      } else if (data && data.length > 0) {
        setSelectedRubric(data[0])
      }

      // If we have a submission ID, fetch the existing evaluation
      if (submissionId) {
        const { data: evaluation, error: evalError } = await supabase
          .from("rubric_evaluations")
          .select("criteria_evaluations, feedback")
          .eq("submission_id", submissionId)
          .single()

        if (!evalError && evaluation) {
          setCriteriaEvaluations(evaluation.criteria_evaluations || {})
          setFeedback(evaluation.feedback || "")
        }
      }
    } catch (err) {
      console.error("Error fetching rubrics:", err)
      toast({
        title: "Error",
        description: "Failed to load rubrics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPoints = () => {
    if (!selectedRubric) {
      setTotalPoints(0)
      return
    }

    let total = 0
    selectedRubric.criteria.forEach((criterion: RubricCriteria) => {
      const selectedLevelId = criteriaEvaluations[criterion.id]
      if (selectedLevelId) {
        const selectedLevel = criterion.levels.find((level) => level.id === selectedLevelId)
        if (selectedLevel) {
          total += selectedLevel.points
        }
      }
    })

    setTotalPoints(total)
  }

  const handleSelectLevel = (criterionId: string, levelId: string) => {
    setCriteriaEvaluations((prev) => ({
      ...prev,
      [criterionId]: levelId,
    }))
  }

  const handleSaveEvaluation = async () => {
    if (!submissionId || !selectedRubric) return

    try {
      setSaving(true)

      // Save the rubric evaluation
      const { error } = await supabase.from("rubric_evaluations").upsert({
        submission_id: submissionId,
        rubric_id: selectedRubric.id,
        criteria_evaluations: criteriaEvaluations,
        feedback,
        total_points: totalPoints,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      // Call the callback with the grade if provided
      if (onGradeSubmit) {
        onGradeSubmit(totalPoints, feedback)
      }

      toast({
        title: "Evaluation Saved",
        description: "The rubric evaluation has been saved successfully",
      })
    } catch (err) {
      console.error("Error saving evaluation:", err)
      toast({
        title: "Error",
        description: "Failed to save evaluation",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const createNewCriteria = () => {
    const newCriteria = {
      id: `criterion_${Date.now()}`,
      name: "New Criterion",
      description: "Description of the criterion",
      points: 10,
      levels: [
        {
          id: `level_${Date.now()}_1`,
          name: "Excellent",
          description: "Exceeds expectations",
          points: 10,
        },
        {
          id: `level_${Date.now()}_2`,
          name: "Satisfactory",
          description: "Meets expectations",
          points: 7,
        },
        {
          id: `level_${Date.now()}_3`,
          name: "Needs Improvement",
          description: "Below expectations",
          points: 3,
        },
      ],
    }

    setEditingRubric((prev) => ({
      ...prev,
      criteria: [...prev.criteria, newCriteria],
    }))
  }

  const handleCreateRubric = async () => {
    try {
      setSaving(true)

      // Create the rubric
      const { data, error } = await supabase
        .from("rubrics")
        .insert({
          name: editingRubric.name,
          description: editingRubric.description,
          criteria: editingRubric.criteria,
          created_by: user?.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setRubrics((prev) => [data, ...prev])
      setSelectedRubric(data)

      // Reset form
      setEditingRubric({
        name: "",
        description: "",
        criteria: [],
      })

      toast({
        title: "Rubric Created",
        description: "Your new rubric has been created successfully",
      })
    } catch (err) {
      console.error("Error creating rubric:", err)
      toast({
        title: "Error",
        description: "Failed to create rubric",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedRubric && rubrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Rubrics Available</CardTitle>
          <CardDescription>Create a rubric to use for grading assignments</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <p className="mb-4">You don't have any rubrics yet. Create your first rubric to get started.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Rubric
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Rubric</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rubric-name">Rubric Name</Label>
                  <Input
                    id="rubric-name"
                    value={editingRubric.name}
                    onChange={(e) => setEditingRubric((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Essay Grading Rubric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubric-description">Description</Label>
                  <Textarea
                    id="rubric-description"
                    value={editingRubric.description}
                    onChange={(e) => setEditingRubric((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose of this rubric"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Criteria</Label>
                    <Button variant="outline" size="sm" onClick={createNewCriteria}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Criterion
                    </Button>
                  </div>

                  {editingRubric.criteria.length === 0 ? (
                    <div className="text-center py-4 border rounded-lg bg-muted/20">
                      <p className="text-muted-foreground">
                        No criteria added yet. Click "Add Criterion" to get started.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] rounded-md border">
                      <div className="p-4 space-y-4">
                        {editingRubric.criteria.map((criterion, index) => (
                          <Card key={criterion.id} className="overflow-hidden">
                            <CardHeader className="p-3 bg-muted/50">
                              <div className="flex items-center justify-between">
                                <Input
                                  value={criterion.name}
                                  onChange={(e) => {
                                    const newCriteria = [...editingRubric.criteria]
                                    newCriteria[index].name = e.target.value
                                    setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                  }}
                                  className="font-medium"
                                  placeholder="Criterion Name"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newCriteria = editingRubric.criteria.filter((_, i) => i !== index)
                                    setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={criterion.description}
                                  onChange={(e) => {
                                    const newCriteria = [...editingRubric.criteria]
                                    newCriteria[index].description = e.target.value
                                    setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                  }}
                                  placeholder="Describe this criterion"
                                  className="h-20"
                                />
                              </div>

                              <div className="mt-3">
                                <Label>Levels</Label>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Level</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Points</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {criterion.levels.map((level, levelIndex) => (
                                      <TableRow key={level.id}>
                                        <TableCell>
                                          <Input
                                            value={level.name}
                                            onChange={(e) => {
                                              const newCriteria = [...editingRubric.criteria]
                                              newCriteria[index].levels[levelIndex].name = e.target.value
                                              setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={level.description}
                                            onChange={(e) => {
                                              const newCriteria = [...editingRubric.criteria]
                                              newCriteria[index].levels[levelIndex].description = e.target.value
                                              setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={level.points}
                                            onChange={(e) => {
                                              const newCriteria = [...editingRubric.criteria]
                                              newCriteria[index].levels[levelIndex].points =
                                                Number.parseInt(e.target.value) || 0
                                              setEditingRubric((prev) => ({ ...prev, criteria: newCriteria }))
                                            }}
                                            className="w-20"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRubric({ name: "", description: "", criteria: [] })}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRubric}
                  disabled={!editingRubric.name || editingRubric.criteria.length === 0 || saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Create Rubric
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle>Rubric-Based Grading</CardTitle>
            <CardDescription>Evaluate the submission using standardized criteria</CardDescription>
          </div>

          {!readOnly && rubrics.length > 0 && (
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Rubric
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">{/* Rubric creation form (same as above) */}</DialogContent>
              </Dialog>

              {selectedRubric && (
                <select
                  className="border rounded p-2 text-sm"
                  value={selectedRubric.id}
                  onChange={(e) => {
                    const selected = rubrics.find((r) => r.id === e.target.value)
                    setSelectedRubric(selected || null)
                  }}
                >
                  {rubrics.map((rubric) => (
                    <option key={rubric.id} value={rubric.id}>
                      {rubric.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {selectedRubric ? (
          <>
            <div>
              <h3 className="text-lg font-medium">{selectedRubric.name}</h3>
              <p className="text-muted-foreground">{selectedRubric.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Criteria</h4>
              <div className="space-y-6">
                {selectedRubric.criteria.map((criterion: RubricCriteria) => (
                  <Card key={criterion.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{criterion.name}</CardTitle>
                      <CardDescription>{criterion.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={criteriaEvaluations[criterion.id] || ""}
                        onValueChange={(value) => handleSelectLevel(criterion.id, value)}
                        disabled={readOnly}
                      >
                        <div className="grid gap-2">
                          {criterion.levels.map((level) => (
                            <div
                              key={level.id}
                              className={`relative flex items-start space-x-3 rounded-lg border p-3 ${
                                criteriaEvaluations[criterion.id] === level.id ? "bg-primary/5 border-primary" : ""
                              }`}
                            >
                              <div className="flex h-5 items-center">
                                <RadioGroupItem value={level.id} id={level.id} />
                              </div>
                              <div className="flex-1">
                                <Label htmlFor={level.id} className="font-medium">
                                  {level.name} ({level.points} points)
                                </Label>
                                <p className="text-sm text-muted-foreground">{level.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Total Points</h3>
                    <div className="text-2xl font-bold">{totalPoints}</div>
                  </div>
                  <div className="mt-2 h-2 w-full bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(totalPoints / (selectedRubric.max_points || 100)) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {!readOnly && (
                <div className="space-y-2">
                  <Label htmlFor="feedback">Overall Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide overall feedback on the submission..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p>Select a rubric to begin grading</p>
          </div>
        )}
      </CardContent>

      {!readOnly && selectedRubric && (
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button
            onClick={handleSaveEvaluation}
            disabled={saving || Object.values(criteriaEvaluations).some((v) => !v)}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Evaluation
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

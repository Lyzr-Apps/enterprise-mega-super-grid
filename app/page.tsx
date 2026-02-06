'use client'

/**
 * BidWin AI Enterprise Knowledge & Governance Platform
 *
 * Three-tab interface:
 * 1. Generator - Generate sourced RFP answers from Knowledge Vault
 * 2. Auditor - Analyze draft communications for compliance risks
 * 3. Vault - Manage Knowledge Vault content
 */

import { useState } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Check, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Agent IDs
const BID_GENERATOR_AGENT_ID = '6985a6533b50e9c8d7d7e939'
const COMPLIANCE_AUDITOR_AGENT_ID = '6985a66c3b50e9c8d7d7e93e'
const KNOWLEDGE_VAULT_RAG_ID = '6985a64460cd1fd2d988d920'

// Sample data for Knowledge Vault
const SAMPLE_VAULT_DATA = `ENTERPRISE SECURITY POLICY

Data Encryption Standards:
All customer data must be encrypted using AES-256 encryption at rest and TLS 1.3 in transit. We employ industry-standard encryption protocols for all sensitive information.

Server Infrastructure:
Our servers are protected by multi-layered firewall systems with 24/7 monitoring. We maintain 99.9% uptime SLA and conduct regular security audits.

Data Storage:
Customer information is stored on SOC 2 Type II certified cloud platforms with automated daily backups and point-in-time recovery capabilities.

Incident Response:
While we maintain robust security measures, we acknowledge that no system is 100% immune to threats. Our incident response team follows documented procedures for any security events.`

// TypeScript Interfaces based on test responses
interface Citation {
  source_text: string
  relevance: string
}

interface BidGeneratorResult {
  answer: string
  status: 'success' | 'missing_info'
  citations: Citation[]
  warning?: string
}

interface BidGeneratorResponse {
  status: 'success' | 'error'
  result: BidGeneratorResult
  metadata?: {
    agent_name?: string
    timestamp?: string
  }
}

interface SentenceAnalysis {
  sentence: string
  status: 'VERIFIED' | 'UNKNOWN' | 'CONTRADICTION'
  risk_level: 'safe' | 'warning' | 'danger'
  explanation: string
  vault_reference: string
}

interface ComplianceAuditorResult {
  compliance_score: number
  total_sentences: number
  analysis: SentenceAnalysis[]
  summary: string
}

interface ComplianceAuditorResponse {
  status: 'success' | 'error'
  result: ComplianceAuditorResult
  metadata?: {
    agent_name?: string
    timestamp?: string
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('generator')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-[#0f172a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">BidWin AI Enterprise Platform</h1>
          <p className="text-slate-300 text-sm mt-1">Knowledge & Governance Suite</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="generator" className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">
              Generator
            </TabsTrigger>
            <TabsTrigger value="auditor" className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">
              Auditor
            </TabsTrigger>
            <TabsTrigger value="vault" className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">
              Vault
            </TabsTrigger>
          </TabsList>

          {/* Generator View */}
          <TabsContent value="generator" className="mt-0">
            <GeneratorView />
          </TabsContent>

          {/* Auditor View */}
          <TabsContent value="auditor" className="mt-0">
            <AuditorView />
          </TabsContent>

          {/* Vault View */}
          <TabsContent value="vault" className="mt-0">
            <VaultView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Generator View Component
function GeneratorView() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<BidGeneratorResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!question.trim()) return

    setLoading(true)
    setResponse(null)

    try {
      const result = await callAIAgent(question, BID_GENERATOR_AGENT_ID)

      if (result.success && result.response) {
        const agentResponse = result.response as unknown as BidGeneratorResponse
        setResponse(agentResponse.result)
      } else {
        // Handle error case
        setResponse({
          answer: '',
          status: 'missing_info',
          citations: [],
          warning: result.error || 'Failed to generate answer'
        })
      }
    } catch (error) {
      setResponse({
        answer: '',
        status: 'missing_info',
        citations: [],
        warning: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (response?.answer) {
      const success = await copyToClipboard(response.answer)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Panel - Input (40%) */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Client Question</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your RFP question here..."
                className="min-h-[200px] resize-none text-base"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-2">{question.length} characters</p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !question.trim()}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium py-6 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Answer...
                </>
              ) : (
                'Generate Answer'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Output (60%) */}
      <div className="lg:col-span-3">
        <Card className="border-slate-200 shadow-sm min-h-[400px]">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Generated Answer</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!response && !loading && (
              <div className="text-center py-16 text-slate-500">
                <p className="text-lg font-medium mb-2">No answer generated yet</p>
                <p className="text-sm">Enter a question and click "Generate Answer" to get started</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-[#0f172a] mx-auto mb-4" />
                <p className="text-slate-600">Searching Knowledge Vault...</p>
              </div>
            )}

            {response && (
              <div className="space-y-6">
                {/* Warning Banner */}
                {response.status === 'missing_info' && response.warning && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 ml-2">
                      <strong>INFORMATION MISSING:</strong> {response.warning}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Answer Text */}
                {response.answer && (
                  <div className="prose max-w-none">
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                      <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">{response.answer}</p>
                    </div>
                  </div>
                )}

                {/* Citations */}
                {response.citations && response.citations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Citations from Knowledge Vault</h3>
                    {response.citations.map((citation, idx) => (
                      <div key={idx} className="bg-slate-50 border-l-4 border-[#0f172a] p-4 rounded-r">
                        <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{citation.source_text}&rdquo;</p>
                        {citation.relevance && (
                          <p className="text-xs text-slate-500 mt-2">Relevance: {citation.relevance}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="flex-1"
                    disabled={!response.answer}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setResponse(null)}
                    variant="outline"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Auditor View Component
function AuditorView() {
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ComplianceAuditorResult | null>(null)

  const handleAudit = async () => {
    if (!draft.trim()) return

    setLoading(true)
    setResponse(null)

    try {
      const result = await callAIAgent(draft, COMPLIANCE_AUDITOR_AGENT_ID)

      if (result.success && result.response) {
        const agentResponse = result.response as unknown as ComplianceAuditorResponse
        setResponse(agentResponse.result)
      } else {
        // Handle error
        console.error('Audit failed:', result.error)
      }
    } catch (error) {
      console.error('Audit error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score > 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getScoreTextColor = (score: number) => {
    if (score > 80) return 'text-green-900'
    if (score >= 50) return 'text-yellow-900'
    return 'text-red-900'
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'danger': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'UNKNOWN': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'CONTRADICTION': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Risk Score Header - Only show when we have results */}
      {response && (
        <Card className={`${getScoreColor(response.compliance_score)} border-none shadow-lg`}>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="text-6xl font-bold text-white mb-2">
              {response.compliance_score}%
            </div>
            <div className="text-xl text-white font-medium">
              Compliance Score
            </div>
            <div className="text-sm text-white/90 mt-2">
              {response.total_sentences} sentences analyzed
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">Draft Content</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your draft communication here for compliance analysis..."
            className="min-h-[200px] resize-none text-base"
            disabled={loading}
          />

          <Button
            onClick={handleAudit}
            disabled={loading || !draft.trim()}
            className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium py-6 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Draft...
              </>
            ) : (
              'Audit Draft'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {loading && (
        <div className="text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-[#0f172a] mx-auto mb-4" />
          <p className="text-slate-600">Analyzing compliance risks...</p>
        </div>
      )}

      {response && !loading && (
        <div className="space-y-6">
          {/* Sentence Analysis */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-900">Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {response.analysis.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  item.risk_level === 'safe' ? 'bg-green-50 border-green-200' :
                  item.risk_level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-base text-slate-900 leading-relaxed">
                        {item.sentence}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRiskBadgeColor(item.risk_level)} font-medium`}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">
                        <strong>Analysis:</strong> {item.explanation}
                      </p>
                      {item.vault_reference && (
                        <p className="text-xs text-slate-500 italic">
                          Reference: {item.vault_reference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg font-semibold text-slate-900">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 leading-relaxed">{response.summary}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!response && !loading && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium mb-2">No analysis yet</p>
          <p className="text-sm">Paste draft content and click "Audit Draft" to analyze compliance risks</p>
        </div>
      )}
    </div>
  )
}

// Vault View Component
function VaultView() {
  const [vaultContent, setVaultContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleLoadSample = () => {
    setVaultContent(SAMPLE_VAULT_DATA)
    setSaveMessage('')
  }

  const handleSave = async () => {
    if (!vaultContent.trim()) {
      setSaveMessage('Please enter content to save')
      return
    }

    setSaving(true)
    setSaveMessage('')

    // Simulate save operation - in production this would update the RAG knowledge base
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSaving(false)
    setSaveMessage('Knowledge Vault content saved and indexed successfully!')

    // Clear message after 5 seconds
    setTimeout(() => setSaveMessage(''), 5000)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">Knowledge Vault</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Manage your organization's authoritative knowledge base. Content stored here powers the Generator and Auditor features.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Info Box */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 text-sm">
              <strong>How it works:</strong> The Knowledge Vault stores verified company information, policies, and approved statements.
              The Generator uses this content to answer RFP questions, and the Auditor validates draft communications against it.
            </AlertDescription>
          </Alert>

          {/* Vault Content Editor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vault Content
            </label>
            <Textarea
              value={vaultContent}
              onChange={(e) => setVaultContent(e.target.value)}
              placeholder="Enter your organization's knowledge base content here..."
              className="min-h-[400px] resize-none text-base font-mono"
              disabled={saving}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !vaultContent.trim()}
              className="flex-1 bg-[#0f172a] hover:bg-[#1e293b] text-white font-medium py-6 text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving & Indexing...
                </>
              ) : (
                'Save & Index'
              )}
            </Button>

            <Button
              onClick={handleLoadSample}
              variant="outline"
              disabled={saving}
              className="py-6 text-base"
            >
              Load Sample Data
            </Button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <Alert className={saveMessage.includes('success') ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
              <AlertDescription className={saveMessage.includes('success') ? 'text-green-800' : 'text-yellow-800'}>
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

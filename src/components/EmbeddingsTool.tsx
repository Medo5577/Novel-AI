/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  FileText, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { 
  EMBEDDING_MODELS, 
  DEFAULT_EMBEDDING_MODEL, 
  generateEmbeddings, 
  semanticSearch,
  cosineSimilarity 
} from '../services/embeddingsService';
import { cn } from '../utils';

export function EmbeddingsTool() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_EMBEDDING_MODEL);
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Semantic Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<string[]>([
    "The quick brown fox jumps over the lazy dog.",
    "Artificial intelligence is transforming the world of technology.",
    "A cat is a small carnivorous mammal often kept as a pet.",
    "The capital of France is Paris, known for its art and culture.",
    "Quantum computing uses qubits to perform complex calculations."
  ]);
  const [newDoc, setNewDoc] = useState('');
  const [searchResults, setSearchResults] = useState<{ document: string; similarity: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleGenerate = async () => {
    if (!textInput.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await generateEmbeddings(textInput, selectedModel);
      setResult(response.data[0].embedding);
    } catch (err: any) {
      setError(err.message || 'Failed to generate embedding');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || documents.length === 0) return;
    setIsSearching(true);
    setError(null);
    try {
      const results = await semanticSearch(searchQuery, documents, selectedModel);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const addDocument = () => {
    if (newDoc.trim()) {
      setDocuments([...documents, newDoc.trim()]);
      setNewDoc('');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-500" />
            Embeddings Tool
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Generate vector representations and perform semantic search using OpenRouter.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Model:</label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-sm text-white focus:outline-none cursor-pointer pr-4"
          >
            {EMBEDDING_MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-zinc-900">{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Section */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Generate Vector
              </h3>
            </div>
            
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to convert into a vector embedding..."
              className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
            />
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !textInput.trim()}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Generate Embedding
            </button>

            {result && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resulting Vector ({result.length} dimensions)</span>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(result))}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-zinc-950 rounded-xl p-3 font-mono text-[10px] text-emerald-500/80 break-all h-24 overflow-y-auto border border-white/5">
                  [{result.slice(0, 50).join(', ')} ... {result.length - 50} more values]
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">What are Embeddings?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Embeddings are numerical representations of data (like text) that capture semantic meaning. 
              In vector space, semantically similar items are positioned closer together. 
              This enables machines to understand relationships between concepts, making them essential for 
              Search, Recommendations, and RAG systems.
            </p>
          </div>
        </div>

        {/* Semantic Search Demo Section */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Semantic Search Demo
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Knowledge Base Documents</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 group">
                      <FileText className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="text-xs text-zinc-300 truncate flex-1">{doc}</span>
                      <button onClick={() => removeDocument(i)} className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDocument()}
                    placeholder="Add a new document..."
                    className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button onClick={addDocument} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Search Query</label>
                <div className="flex gap-2">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ask something semantically..."
                    className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3 pt-4 animate-in fade-in duration-300">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Search Results (Ranked by Similarity)</label>
                  <div className="space-y-2">
                    {searchResults.map((res, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                            Match Score: {(res.similarity * 100).toFixed(1)}%
                          </span>
                          {i === 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{res.document}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

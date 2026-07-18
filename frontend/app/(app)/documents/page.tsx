"use client";
import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Spinner, Table, Th, Td, Tr, Progress } from "@/components/ui/index";
import { Upload, FileText, Search } from "lucide-react";

const SEEDED_DOCS = [
  { id:"seed-001", filename:"Electrical_Specification_Rev_C.pdf",       doc_type:"specification",  chunks:4,  indexed:true, size:"2.1 MB" },
  { id:"seed-002", filename:"Transformer_T2B_Submittal_Daikin_Rev1.pdf", doc_type:"submittal",      chunks:2,  indexed:true, size:"890 KB" },
  { id:"seed-003", filename:"Switchgear_SW_B1_ABB_Submittal.pdf",        doc_type:"submittal",      chunks:1,  indexed:true, size:"1.2 MB" },
  { id:"seed-004", filename:"RFI_Log_June_2026.pdf",                     doc_type:"rfi",            chunks:3,  indexed:true, size:"430 KB" },
  { id:"seed-005", filename:"TIA942_Cx_Procedures_Rev2.pdf",             doc_type:"commissioning",  chunks:3,  indexed:true, size:"3.4 MB" },
];

const DOC_TYPE_COLORS: Record<string, any> = {
  specification: "accent", submittal: "purple", rfi: "warning",
  commissioning: "success", schedule: "accent", drawing: "default",
};

export default function DocumentsPage() {
  const [docs, setDocs]           = useState(SEEDED_DOCS);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [searchQ, setSearchQ]     = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File, docType = "spec") => {
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_type", docType);
      const result = await api.uploadDocument(fd);
      setUploadResult(result);
      if (result.status === "indexed") {
        setDocs(prev => [...prev, {
          id: result.doc_id, filename: result.filename,
          doc_type: docType, chunks: result.chunks_indexed,
          indexed: true, size: `${(result.file_size_bytes / 1024).toFixed(0)} KB`,
        }]);
      }
    } catch (e: any) {
      setUploadResult({ error: e.message });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const search = useCallback(async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await api.searchDocuments(searchQ);
      setSearchResults(r.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQ]);

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text mb-1">Document Intelligence</h1>
        <p className="text-sm text-muted">Upload · Extract · Embed · Search · 14,200 chunks indexed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Upload */}
        <Card>
          <CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
          <CardContent>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver ? "border-accent bg-accent/10" : "border-border2 hover:border-accent/40 hover:bg-surface2"
              }`}>
              <Upload size={24} className="text-muted mx-auto mb-3" />
              <div className="text-sm font-semibold text-text mb-1">Drop PDF or DOCX here</div>
              <div className="text-xs text-muted">or click to browse · PDF, DOCX, TXT supported</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />

            {uploading && (
              <div className="mt-4 p-3 rounded-lg bg-surface2 border border-border flex items-center gap-3">
                <Spinner size="sm" />
                <div className="text-xs text-dim">Extracting text → chunking → embedding → indexing…</div>
              </div>
            )}
            {uploadResult && !uploadResult.error && (
              <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="text-xs text-success font-semibold mb-1">✓ {uploadResult.filename}</div>
                <div className="text-xs text-muted">{uploadResult.chunks_indexed} chunks indexed into Qdrant</div>
              </div>
            )}
            {uploadResult?.error && (
              <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30">
                <div className="text-xs text-danger">{uploadResult.error}</div>
                <div className="text-xs text-muted mt-1">Backend must be running for uploads. Mock docs are pre-indexed.</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Semantic Search */}
        <Card>
          <CardHeader><CardTitle>Semantic Search</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="e.g. transformer impedance specification…"
                className="flex-1 bg-surface2 border border-border2 rounded-lg text-text text-xs px-3 py-2.5 outline-none focus:border-accent/50 transition-colors placeholder:text-muted"
              />
              <Button variant="primary" size="sm" onClick={search} disabled={searching || !searchQ.trim()}>
                {searching ? <Spinner size="xs" /> : <Search size={13} />} Search
              </Button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface2 border border-border hover:border-border2 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={DOC_TYPE_COLORS[r.doc_type] || "default"}>{r.doc_type}</Badge>
                      <span className="text-[11px] text-muted truncate">{r.filename}</span>
                      <Badge variant="accent" className="ml-auto flex-shrink-0">{(r.score * 100).toFixed(0)}%</Badge>
                    </div>
                    <div className="text-xs text-dim leading-relaxed line-clamp-2">{r.text}</div>
                  </div>
                ))}
              </div>
            ) : searching ? (
              <div className="flex items-center gap-2 text-muted text-xs py-4">
                <Spinner size="xs" /> Searching 14,200 chunks…
              </div>
            ) : (
              <div className="text-xs text-muted py-4 text-center">
                Search across all indexed project documents using semantic similarity
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Library */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <Badge variant="accent">{docs.length} documents · {docs.reduce((a, d) => a + d.chunks, 0)} chunks</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Filename</Th><Th>Type</Th><Th>Chunks</Th><Th>Size</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <Tr key={i}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-muted flex-shrink-0" />
                      <span className="text-text text-xs font-medium truncate max-w-xs">{d.filename}</span>
                    </div>
                  </Td>
                  <Td><Badge variant={DOC_TYPE_COLORS[d.doc_type] || "default"}>{d.doc_type}</Badge></Td>
                  <Td className="text-text font-semibold">{d.chunks}</Td>
                  <Td>{d.size}</Td>
                  <Td>
                    {d.indexed
                      ? <Badge variant="success">✓ Indexed</Badge>
                      : <Badge variant="warning">Pending</Badge>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

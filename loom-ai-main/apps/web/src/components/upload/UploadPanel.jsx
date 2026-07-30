/**
 * @file UploadPanel.jsx
 * @description Drag & drop project upload modal UI with upload progress indicators, stack auto-detection, and file validation placeholders.
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useUI } from '../../contexts/UIContext';
import { useProject } from '../../contexts/ProjectContext';
import { useChat } from '../../contexts/ChatContext';
import { uploadProject } from '../../lib/apiClient';

export function UploadPanel() {
  const { isUploadModalOpen, setIsUploadModalOpen, showToast, setViewMode } = useUI();
  const { setActiveStack, setFiles } = useProject();
  const { setActiveProjectId } = useChat();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [detectedStack, setDetectedStack] = useState('auto');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesList(e.dataTransfer.files);
    }
  };

  const processFilesList = (filesList) => {
    const filesArray = Array.from(filesList);
    setSelectedFiles(filesArray);

    if (filesArray.length === 1) {
      const file = filesArray[0];
      if (file.name.endsWith('.zip')) {
        setDetectedStack('auto'); // backend will detect
      } else {
        const isReact = file.name.includes('react') || file.name.endsWith('.jsx') || file.name.includes('tailwind');
        setDetectedStack(isReact ? 'react-tailwind' : 'vanilla');
      }
    } else {
      // Check if any file looks like React
      const hasReact = filesArray.some(file => 
        file.name.includes('App.js') || 
        file.name.includes('App.jsx') || 
        file.name.includes('tailwind.config.js')
      );
      setDetectedStack(hasReact ? 'react-tailwind' : 'vanilla');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);

    try {
      let response;
      const isZip = selectedFiles.length === 1 && selectedFiles[0].name.endsWith('.zip');

      if (isZip) {
        // 1. Single ZIP file upload via FormData
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        response = await uploadProject(formData);
      } else {
        // 2. Direct multiple text files upload
        const uploadFiles = {};
        for (const file of selectedFiles) {
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result || '');
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
          });
          uploadFiles[file.name] = content;
        }

        // Fallback for single file layout injection if only 1 file selected
        if (selectedFiles.length === 1) {
          const singleFile = selectedFiles[0];
          if (detectedStack === 'vanilla' && singleFile.name === 'index.html') {
            uploadFiles['style.css'] = `/* Generated style */\nbody { background: #0b0b0e; color: #f8fafc; }`;
            uploadFiles['script.js'] = `// Generated script\nconsole.log('App loaded');`;
          } else if (detectedStack === 'react-tailwind' && (singleFile.name.endsWith('.jsx') || singleFile.name.endsWith('.js'))) {
            // Place at App.js/jsx
            const filename = singleFile.name.endsWith('.jsx') ? 'App.jsx' : 'App.js';
            uploadFiles[filename] = uploadFiles[singleFile.name];
          }
        }

        response = await uploadProject(uploadFiles);
      }

      setIsUploading(false);
      setActiveStack(response.data.stack);
      setFiles(response.data.files);
      setActiveProjectId(response.data.projectId);
      setIsUploadModalOpen(false);
      setViewMode('workspace');
      showToast(response.data.message, 'success');
      
      // Reset selected files
      setSelectedFiles([]);
    } catch (err) {
      setIsUploading(false);
      showToast(`Import failed: ${err.message}`, 'warning');
    }
  };

  return (
    <Modal
      isOpen={isUploadModalOpen}
      onClose={() => {
        setIsUploadModalOpen(false);
        setSelectedFiles([]);
      }}
      title="Upload Project"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Dropzone Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/15 bg-slate-950/40 hover:border-white/30 hover:bg-slate-950/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Drag & drop project .zip or files here
          </p>
          <p className="text-xs text-slate-400 mb-4">Supports Vanilla HTML/CSS/JS or React + Tailwind projects</p>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".zip,.js,.jsx,.html,.css"
            onChange={(e) => e.target.files && processFilesList(e.target.files)}
          />
          <Button 
            variant="glass" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>

        {/* Selected File(s) & Auto-Detection Status */}
        {selectedFiles.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="truncate max-w-[180px]">
                  {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}
                </span>
              </div>
              <Badge variant={detectedStack === 'vanilla' ? 'indigo' : detectedStack === 'react-tailwind' ? 'purple' : 'teal'}>
                {detectedStack === 'vanilla' 
                  ? 'Vanilla' 
                  : detectedStack === 'react-tailwind'
                    ? 'React + Tailwind'
                    : 'Auto-Detect Stack'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Project validation complete. Ready to import state.</span>
            </div>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setIsUploadModalOpen(false);
            setSelectedFiles([]);
          }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedFiles.length === 0}
            isLoading={isUploading}
            onClick={handleUpload}
          >
            Import Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default UploadPanel;

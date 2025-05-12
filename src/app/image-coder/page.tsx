'use client';

import { useState, useEffect } from 'react';
import { FaImage, FaCode, FaExchangeAlt, FaCloudUploadAlt, FaDownload } from 'react-icons/fa';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function ImageCoderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [mode, setMode] = useState<'image-to-code' | 'code-to-image'>('image-to-code');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedCode(e.target.value);
  };

  const handleProcessImage = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // This would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate response - in a real app, this would come from an API
      if (mode === 'image-to-code') {
        setGeneratedCode(`<!-- Generated HTML for the uploaded image -->
<div class="container">
  <div class="header">
    <h1>Welcome to TubeIntel</h1>
    <nav>
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Analytics</a></li>
        <li><a href="#">Settings</a></li>
      </ul>
    </nav>
  </div>
</div>`);
      } else {
        // For demo, we're just setting a placeholder image
        setUploadedImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError('Failed to process the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setMode(mode === 'image-to-code' ? 'code-to-image' : 'image-to-code');
    setUploadedImage(null);
    setGeneratedCode(null);
    setError('');
  };

  const handleDownload = () => {
    if (mode === 'image-to-code' && generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-code.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (mode === 'code-to-image' && uploadedImage) {
      const a = document.createElement('a');
      a.href = uploadedImage;
      a.download = 'generated-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <FaImage className="text-indigo-500 text-3xl mr-2" />
            <h1 className="text-3xl font-bold dark:text-white">Image Coder</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Convert between images and code seamlessly</p>
        </div>

        {/* Mode Switch */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-center items-center">
            <span className={`font-medium mr-3 ${mode === 'image-to-code' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Image to Code
            </span>
            <button 
              onClick={handleSwitchMode}
              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
            >
              <FaExchangeAlt />
            </button>
            <span className={`font-medium ml-3 ${mode === 'code-to-image' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
              Code to Image
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              {mode === 'image-to-code' ? 'Upload Image' : 'Enter Code'}
            </h2>
            
            {mode === 'image-to-code' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center">
                  {uploadedImage ? (
                    <div className="w-full">
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded" 
                        className="max-w-full max-h-64 mx-auto rounded-md"
                      />
                      <button 
                        onClick={() => setUploadedImage(null)} 
                        className="mt-3 text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                      <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
                        Drag and drop an image here, or click to select
                      </p>
                      <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md cursor-pointer">
                        Select Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="Enter HTML, CSS, or other code here..."
                value={generatedCode || ''}
                onChange={handleCodeInput}
              ></textarea>
            )}

            <button
              onClick={handleProcessImage}
              disabled={isLoading || (mode === 'image-to-code' && !uploadedImage) || (mode === 'code-to-image' && !generatedCode)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : mode === 'image-to-code' ? 'Generate Code' : 'Generate Image'}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              {mode === 'image-to-code' ? 'Generated Code' : 'Generated Image'}
            </h2>
            
            {mode === 'image-to-code' ? (
              <>
                {generatedCode ? (
                  <div className="relative">
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-64 font-mono text-sm">
                      {generatedCode}
                    </pre>
                    <button
                      onClick={handleDownload}
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      <FaDownload /> Download Code
                    </button>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">
                      Generated code will appear here
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {uploadedImage ? (
                  <div className="text-center">
                    <img 
                      src={uploadedImage} 
                      alt="Generated" 
                      className="max-w-full max-h-64 mx-auto rounded-md"
                    />
                    <button
                      onClick={handleDownload}
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      <FaDownload /> Download Image
                    </button>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">
                      Generated image will appear here
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Tip:</span> For best results, use clear images with distinct UI elements when converting to code.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link 
            href="/dashboard" 
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 
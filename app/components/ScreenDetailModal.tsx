'use client';

import { useEffect, useState } from 'react';
import { X, MessageSquare, Link2, ChevronRight, ChevronLeft, MoreHorizontal, Settings } from 'lucide-react';

type Capture = {
  screenshot_url: string;
  captured_at: string;
  has_changes?: boolean;
  change_summary?: string;
};

type Route = {
  id: string;
  name: string;
  path: string;
  flow_name: string;
  captures: Capture[];
};

type Annotation = {
  id: number;
  x: number;
  y: number;
  status: 'changed' | 'new' | 'fixed';
  title: string;
  description: string;
  timeAgo: string;
};

type ScreenDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
  allRoutes: Route[];
};

// Mock annotations for demo - in production, these would come from the database
const getMockAnnotations = (routeId: string, hasChanges?: boolean): Annotation[] => {
  if (!hasChanges) return [];

  return [
    {
      id: 1,
      x: 30,
      y: 15,
      status: 'changed',
      title: 'Header navigation updated',
      description: 'Navigation items have been reorganized. The user profile icon moved to the right side of the header.',
      timeAgo: '1hr ago'
    },
    {
      id: 2,
      x: 50,
      y: 35,
      status: 'changed',
      title: 'Button style modified',
      description: 'Primary button color changed from blue to green. Padding increased by 4px.',
      timeAgo: '1hr ago'
    },
    {
      id: 3,
      x: 45,
      y: 60,
      status: 'new',
      title: 'New footer link added',
      description: 'A new "Help Center" link was added to the footer navigation.',
      timeAgo: '1hr ago'
    },
    {
      id: 4,
      x: 70,
      y: 45,
      status: 'changed',
      title: 'Form field layout updated',
      description: 'Input fields now use full width instead of 50%. Label positioning changed to top-aligned.',
      timeAgo: '1hr ago'
    }
  ];
};

export default function ScreenDetailModal({ isOpen, onClose, route, allRoutes }: ScreenDetailModalProps) {
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'default' | 'compare'>('default');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showViewFlow, setShowViewFlow] = useState(false);

  useEffect(() => {
    if (route && allRoutes.length > 0) {
      const index = allRoutes.findIndex(r => r.id === route.id);
      if (index !== -1) {
        setCurrentRouteIndex(index);
      }
    }
  }, [route, allRoutes]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !route) return null;

  const currentRoute = allRoutes[currentRouteIndex] || route;
  const latestCapture = currentRoute.captures?.[0];
  const previousCapture = currentRoute.captures?.[1];

  // Get annotations for current route
  const annotations = getMockAnnotations(currentRoute.id, latestCapture?.has_changes);

  // Get all routes in the same flow for view flow mode
  const flowRoutes = allRoutes.filter(r => r.flow_name === currentRoute.flow_name);

  const handleNext = () => {
    if (currentRouteIndex < allRoutes.length - 1) {
      setCurrentRouteIndex(currentRouteIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentRouteIndex > 0) {
      setCurrentRouteIndex(currentRouteIndex - 1);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const formatVersionTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = Date.now();
    const seconds = Math.floor((now - date.getTime()) / 1000);

    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}hr ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
      {/* Header */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <span className="text-sm text-gray-400">Found in</span>
        <span className="px-3 py-1 text-sm text-white rounded-md" style={{ backgroundColor: '#2A2A2A' }}>
          {currentRoute.flow_name || 'Uncategorized'}
        </span>
      </div>

      {/* Top right controls */}
      <div className="absolute top-8 right-8 flex items-center gap-3">
        {/* Avatar stack placeholder */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs text-white">
            +5
          </div>
        </div>

        <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors">
          <MessageSquare size={24} />
        </button>

        <button className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors">
          <Link2 size={24} />
        </button>

        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main content area */}
      <div className="relative w-full h-full flex items-center justify-center px-32 py-32">
        {/* Previous button */}
        {!showViewFlow && currentRouteIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-8 w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg z-10"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
        )}

        {/* Content container with right panel if annotations are on */}
        <div className={`flex gap-6 w-full h-full items-center ${showAnnotations ? 'justify-center' : 'justify-center'}`}>
          {/* Main screenshot area */}
          <div className="flex-1 flex items-center justify-center">
            {/* STATE 1 & 2: Default mode (single screenshot) */}
            {viewMode === 'default' && !showViewFlow && (
              <div className="relative">
                <div className="rounded-xl p-8" style={{ backgroundColor: '#2A2A2A' }}>
                  {latestCapture?.screenshot_url ? (
                    <div className="relative">
                      <img
                        src={latestCapture.screenshot_url}
                        alt={currentRoute.name}
                        className="max-h-[70vh] w-auto mx-auto rounded-lg shadow-2xl"
                      />

                      {/* Annotation markers - STATE 2 */}
                      {showAnnotations && annotations.map(annotation => (
                        <div
                          key={annotation.id}
                          className="absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: '#F87171',
                            left: `${annotation.x}%`,
                            top: `${annotation.y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        >
                          {annotation.id}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center text-gray-500">
                      No screenshot available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STATE 3: Compare mode (two screenshots side by side) */}
            {viewMode === 'compare' && !showViewFlow && (
              <div className="flex gap-6">
                {/* Current version */}
                <div className="relative">
                  <div className="rounded-xl p-8" style={{ backgroundColor: '#2A2A2A' }}>
                    {latestCapture?.screenshot_url ? (
                      <div className="relative">
                        <div className="absolute -top-2 left-4 px-3 py-1 bg-gray-800 text-white text-xs rounded-md">
                          v1.12 • {formatVersionTime(latestCapture.captured_at)}
                        </div>
                        <img
                          src={latestCapture.screenshot_url}
                          alt={`${currentRoute.name} - current`}
                          className="max-h-[65vh] w-auto rounded-lg shadow-2xl"
                        />

                        {/* Annotation markers on current */}
                        {showAnnotations && annotations.map(annotation => (
                          <div
                            key={annotation.id}
                            className="absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                            style={{
                              backgroundColor: '#F87171',
                              left: `${annotation.x}%`,
                              top: `${annotation.y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            {annotation.id}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center text-gray-500">
                        No current screenshot
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous version */}
                <div className="relative">
                  <div className="rounded-xl p-8" style={{ backgroundColor: '#2A2A2A' }}>
                    {previousCapture?.screenshot_url ? (
                      <div className="relative">
                        <div className="absolute -top-2 left-4 px-3 py-1 bg-gray-800 text-white text-xs rounded-md">
                          v1.1 • {formatVersionTime(previousCapture.captured_at)}
                        </div>
                        <img
                          src={previousCapture.screenshot_url}
                          alt={`${currentRoute.name} - previous`}
                          className="max-h-[65vh] w-auto rounded-lg shadow-2xl"
                        />

                        {/* Annotation markers on previous (matching numbers) */}
                        {showAnnotations && annotations.map(annotation => (
                          <div
                            key={annotation.id}
                            className="absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                            style={{
                              backgroundColor: annotation.status === 'new' ? '#60A5FA' : '#F87171',
                              left: `${annotation.x}%`,
                              top: `${annotation.y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            {annotation.id}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center text-gray-500">
                        No previous screenshot
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 4: View Flow mode (grid of thumbnails) */}
            {showViewFlow && (
              <div className="w-full h-full overflow-y-auto px-8 py-4">
                <div className="grid grid-cols-4 gap-4">
                  {flowRoutes.map(flowRoute => {
                    const isCurrentRoute = flowRoute.id === currentRoute.id;
                    const routeCapture = flowRoute.captures?.[0];

                    return (
                      <div
                        key={flowRoute.id}
                        onClick={() => {
                          const index = allRoutes.findIndex(r => r.id === flowRoute.id);
                          if (index !== -1) setCurrentRouteIndex(index);
                        }}
                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isCurrentRoute
                            ? 'ring-4 ring-blue-500 scale-105'
                            : 'hover:ring-2 hover:ring-gray-400'
                        }`}
                        style={{ width: '200px' }}
                      >
                        <div className="aspect-video bg-gray-200">
                          {routeCapture?.screenshot_url ? (
                            <img
                              src={routeCapture.screenshot_url}
                              alt={flowRoute.name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No screenshot
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">{flowRoute.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right panel for annotations - STATE 2, 3, 4 */}
          {showAnnotations && annotations.length > 0 && (
            <div className="h-full overflow-y-auto bg-white rounded-xl p-4 shadow-lg" style={{ width: '280px', maxHeight: 'calc(100vh - 200px)' }}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {showViewFlow ? 'All Annotations' : 'Changes'}
              </h3>

              {/* Color key legend */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-gray-600">Changed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-gray-600">New</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-gray-600">Fixed</span>
                  </div>
                </div>
              </div>

              {showViewFlow ? (
                // Group annotations by screen for view flow mode
                <div className="space-y-4">
                  {flowRoutes.map((flowRoute, screenIndex) => {
                    const routeAnnotations = getMockAnnotations(flowRoute.id, flowRoute.captures?.[0]?.has_changes);
                    if (routeAnnotations.length === 0) return null;

                    return (
                      <div key={flowRoute.id}>
                        <h4 className="text-xs font-medium text-gray-500 mb-2">
                          Screen {screenIndex + 1}
                        </h4>
                        {routeAnnotations.map(annotation => {
                          const isNew = annotation.status === 'new';
                          const isFixed = annotation.status === 'fixed';
                          const borderColor = isNew ? 'border-blue-400' : isFixed ? 'border-green-400' : 'border-red-400';
                          const bgColor = isNew ? 'bg-blue-400' : isFixed ? 'bg-green-400' : 'bg-red-400';
                          const textColor = isNew ? 'text-blue-600' : isFixed ? 'text-green-600' : 'text-red-600';

                          return (
                            <div key={annotation.id} className={`mb-3 bg-gray-50 rounded-lg p-3 border-l-2 ${borderColor}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
                                  {annotation.id}
                                </div>
                                <span className={`text-xs font-medium ${textColor}`}>
                                  {annotation.status === 'changed' && 'Changed'}{annotation.status === 'new' && 'New'}{annotation.status === 'fixed' && 'Fixed'} • {annotation.timeAgo}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-1">{annotation.title}</p>
                              <p className="text-xs text-gray-600">{annotation.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Regular annotation list for default/compare modes
                <div className="space-y-3">
                  {annotations.map(annotation => {
                    const isNew = annotation.status === 'new';
                    const isFixed = annotation.status === 'fixed';
                    const borderColor = isNew ? 'border-blue-400' : isFixed ? 'border-green-400' : 'border-red-400';
                    const bgColor = isNew ? 'bg-blue-400' : isFixed ? 'bg-green-400' : 'bg-red-400';
                    const textColor = isNew ? 'text-blue-600' : isFixed ? 'text-green-600' : 'text-red-600';

                    return (
                      <div key={annotation.id} className={`bg-white rounded-lg p-3 border-l-4 ${borderColor} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
                            {annotation.id}
                          </div>
                          <span className={`text-xs font-medium ${textColor}`}>
                            {annotation.status === 'changed' && 'Changed'}{annotation.status === 'new' && 'New'}{annotation.status === 'fixed' && 'Fixed'} • {annotation.timeAgo}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{annotation.title}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{annotation.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next button */}
        {!showViewFlow && currentRouteIndex < allRoutes.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-8 w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg z-10"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronRight size={24} className="text-gray-900" />
          </button>
        )}
      </div>

      {/* Settings panel */}
      <div className="absolute bottom-24 right-8 bg-white rounded-xl p-4 shadow-lg" style={{ width: '200px' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">View flow</span>
          <button
            onClick={() => setShowViewFlow(!showViewFlow)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              showViewFlow ? 'bg-gray-900' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                showViewFlow ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Annotations</span>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              showAnnotations ? 'bg-gray-900' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                showAnnotations ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button className="absolute -bottom-2 right-4 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
          <Settings size={18} />
        </button>
      </div>

      {/* Bottom left controls */}
      <div className="absolute bottom-8 left-8 flex items-center gap-3">
        <button className="px-6 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
          Copy
        </button>

        <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Bottom right mode toggle */}
      <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setViewMode('default')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'default'
              ? 'bg-gray-900 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Default
        </button>

        <button
          onClick={() => setViewMode('compare')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'compare'
              ? 'bg-gray-900 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Compare
        </button>
      </div>
    </div>
  );
}

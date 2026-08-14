'use client';

import React, { useState } from 'react';
import { WorldFeed } from '@/components/community/WorldFeed';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { QuestionForm } from '@/components/community/QuestionForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, HelpCircle, Users, Sparkles, Plus, Compass } from 'lucide-react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/40 to-slate-900/60 border border-violet-500/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 text-violet-400 font-semibold text-sm tracking-wide uppercase mb-2">
                <Users className="w-4 h-4" /> BreakIn Developer Collective
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Community Hub & Forums
              </h1>
              <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
                Collaborate with fellow engineers, share real sprint solutions, ask architectural questions, and connect with mentors across global teams.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowQuestionModal(true)}
                variant="outline"
                className="border-violet-500/30 hover:bg-violet-500/10 text-violet-200"
              >
                <HelpCircle className="w-4 h-4 mr-2" /> Ask Question
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Post
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs & Main Feed */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <TabsList className="bg-slate-900/80 border border-slate-800 p-1">
              <TabsTrigger value="feed" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                <Compass className="w-4 h-4 mr-2" /> Global Feed
              </TabsTrigger>
              <TabsTrigger value="discussions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" /> Discussions
              </TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                <HelpCircle className="w-4 h-4 mr-2" /> Q&A Board
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="mt-0">
            <WorldFeed />
          </TabsContent>

          <TabsContent value="discussions" className="mt-0">
            <WorldFeed />
          </TabsContent>

          <TabsContent value="qa" className="mt-0">
            <div className="space-y-6">
              <QuestionForm onCancel={() => setActiveTab('feed')} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Post Dialog Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <CreatePostForm
                onSuccess={() => setShowCreateModal(false)}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        )}

        {/* Ask Question Dialog Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <QuestionForm
                onSuccess={() => setShowQuestionModal(false)}
                onCancel={() => setShowQuestionModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

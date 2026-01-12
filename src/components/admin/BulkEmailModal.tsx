'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    eventDate: string;
    location?: string;
    registered: number;
  };
}

export default function BulkEmailModal({
  isOpen,
  onClose,
  eventData,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState(`Update: ${eventData.title}`);
  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('registered');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    successful?: number;
    total?: number;
  } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please provide both subject and message');
      return;
    }

    try {
      setSending(true);
      setResult(null);

      const response = await fetch(`/api/events/${eventData.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          recipientFilter,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          sent: data.details.sent,
          failed: data.details.failed,
          successful: data.details.sent,
          total: data.details.sent + data.details.failed,
        });
        setTimeout(() => {
          onClose();
          setSubject(`Update: ${eventData.title}`);
          setMessage('');
          setResult(null);
        }, 3000);
      } else {
        alert(data.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Send Bulk Email</h2>
                  <p className="text-white/90">{eventData.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {result ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Emails Sent Successfully!
                </h3>
                <p className="text-gray-600 mb-4">
                  Sent to {result.successful} of {result.total} attendees
                </p>
                {result.failed > 0 && (
                  <p className="text-sm text-orange-600">
                    {result.failed} email(s) failed to send
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recipient Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send To
                  </label>
                  <select
                    value={recipientFilter}
                    onChange={(e) => setRecipientFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Attendees</option>
                    <option value="registered">Registered Only</option>
                    <option value="attended">Attended Only</option>
                    <option value="cancelled">Cancelled Only</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    <Users className="h-4 w-4 inline mr-1" />
                    Total registered: {eventData.registered}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... (Event details will be automatically included)"
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Event details and footer will be automatically added to the
                    email.
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Email Preview
                  </h4>
                  <div className="bg-white rounded p-4 border border-gray-200 text-sm">
                    <p className="font-semibold mb-2">{subject}</p>
                    <p className="text-gray-600 whitespace-pre-wrap mb-4">
                      {message || '(Your message will appear here)'}
                    </p>
                    <hr className="my-4" />
                    <p className="text-sm text-gray-600">
                      <strong>Event Details:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      <li>• Event: {eventData.title}</li>
                      <li>
                        • Date:{' '}
                        {new Date(eventData.eventDate).toLocaleDateString()}
                      </li>
                      <li>• Location: {eventData.location || 'GemFitness Gbestile'}</li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-4">
                      Best regards,
                      <br />
                      GemFitness Team
                    </p>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important</p>
                    <p>
                      Only members who have enabled email notifications will
                      receive this email. All members will see it in their
                      dashboard notifications.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
            <Button onClick={onClose} variant="outline" disabled={sending}>
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !message.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

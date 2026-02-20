/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  Info,
  Camera,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoCapture } from './PhotoCapture';

// Validation helper
const validateItem = (item, value, photoValue) => {
  const errors = [];
  
  if (item.required && !value) {
    errors.push('This item requires a response');
  }
  
  if (item.photoRequiredOnFail && value === 'fail' && !photoValue) {
    errors.push('Photo evidence required for failed items');
  }
  
  return errors;
};

// Checklist Item with guidance
export function GuidedChecklistItem({
  id,
  label,
  description,
  guidance,
  value,
  onChange,
  photoValue,
  onPhotoChange,
  required = false,
  critical = false,
  photoRequiredOnFail = true,
  validationErrors = []
}) {
  const [showGuidance, setShowGuidance] = useState(false);
  const [touched, setTouched] = useState(false);

  const hasErrors = touched && validationErrors.length > 0;
  const isComplete = value && (value !== 'fail' || !photoRequiredOnFail || photoValue);

  const handleSelect = (newValue) => {
    setTouched(true);
    onChange(newValue);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border transition-all ${
        hasErrors ? 'bg-red-500/10 border-red-500/50' :
        value === 'pass' ? 'bg-emerald-500/10 border-emerald-500/30' :
        value === 'fail' ? 'bg-red-500/10 border-red-500/30' :
        value === 'na' ? 'bg-slate-500/10 border-slate-500/30' :
        'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${
          isComplete ? 'bg-emerald-500/20' : 
          hasErrors ? 'bg-red-500/20' : 'bg-slate-700'
        }`}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : hasErrors ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : (
            <HelpCircle className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-medium">{label}</p>
            {required && <Badge className="bg-amber-500/20 text-amber-400 text-xs">Required</Badge>}
            {critical && <Badge className="bg-red-500/20 text-red-400 text-xs">Critical</Badge>}
          </div>
          {description && (
            <p className="text-slate-400 text-sm mt-1">{description}</p>
          )}
        </div>
        {guidance && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowGuidance(!showGuidance)}
            className={`h-8 w-8 ${showGuidance ? 'text-cyan-400' : 'text-slate-400'}`}
          >
            <Info className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Guidance Panel */}
      <AnimatePresence>
        {showGuidance && guidance && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-cyan-400 text-sm font-medium mb-1">Inspection Guidance</p>
                  <p className="text-slate-300 text-sm">{guidance}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pass/Fail/NA Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          type="button"
          variant={value === 'pass' ? 'default' : 'outline'}
          onClick={() => handleSelect('pass')}
          className={`h-14 gap-2 ${
            value === 'pass' 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          Pass
        </Button>
        <Button
          type="button"
          variant={value === 'fail' ? 'default' : 'outline'}
          onClick={() => handleSelect('fail')}
          className={`h-14 gap-2 ${
            value === 'fail' 
              ? 'bg-red-600 hover:bg-red-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <XCircle className="w-5 h-5" />
          Fail
        </Button>
        <Button
          type="button"
          variant={value === 'na' ? 'default' : 'outline'}
          onClick={() => handleSelect('na')}
          className={`h-14 gap-2 ${
            value === 'na' 
              ? 'bg-slate-600 hover:bg-slate-700 text-white border-0' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <MinusCircle className="w-5 h-5" />
          N/A
        </Button>
      </div>

      {/* Critical Warning */}
      {critical && value === 'fail' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-semibold text-sm">CRITICAL FAILURE</p>
              <p className="text-red-300 text-xs">This will significantly impact the compliance score and may require EHP referral.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Photo Evidence for Failed Items */}
      {value === 'fail' && photoRequiredOnFail && onPhotoChange && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <PhotoCapture
            label="Evidence Photo"
            description="Required: Capture photo evidence of the non-compliance"
            value={photoValue}
            onChange={onPhotoChange}
            required
          />
        </motion.div>
      )}

      {/* Validation Errors */}
      {hasErrors && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mt-3 text-red-400 text-sm"
        >
          <AlertTriangle className="w-4 h-4" />
          {validationErrors[0]}
        </motion.div>
      )}
    </motion.div>
  );
}

// Section Header with Progress
export function SectionHeader({ 
  icon: Icon, 
  title, 
  description, 
  color = 'text-cyan-400',
  completedCount,
  totalCount,
  errors = []
}) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const hasErrors = errors.length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 rounded-xl ${
          progress === 100 && !hasErrors
            ? 'bg-emerald-500/20' 
            : hasErrors 
            ? 'bg-red-500/20'
            : 'bg-slate-700'
        }`}>
          <Icon className={`w-6 h-6 ${
            progress === 100 && !hasErrors ? 'text-emerald-400' : color
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {description && <p className="text-slate-400 text-sm">{description}</p>}
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${
            progress === 100 && !hasErrors ? 'text-emerald-400' : 
            hasErrors ? 'text-red-400' : 'text-white'
          }`}>
            {completedCount}/{totalCount}
          </p>
          <p className="text-slate-400 text-xs">completed</p>
        </div>
      </div>
      <Progress 
        value={progress} 
        className={`h-2 ${hasErrors ? 'bg-red-900/50' : 'bg-slate-700'}`} 
      />
      {hasErrors && (
        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {errors.length} issue{errors.length > 1 ? 's' : ''} need{errors.length === 1 ? 's' : ''} attention
        </p>
      )}
    </div>
  );
}

// Step Navigation with Validation
export function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  canProceed = true,
  validationErrors = [],
  isSubmitting = false
}) {
  const isLastStep = currentStep === totalSteps - 1;
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="mt-6 pt-6 border-t border-slate-700">
      {/* Validation Summary */}
      {hasErrors && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400 font-medium text-sm flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Please fix the following before continuing:
          </p>
          <ul className="text-red-300 text-sm space-y-1 ml-6">
            {validationErrors.slice(0, 3).map((error, i) => (
              <li key={i} className="list-disc">{error}</li>
            ))}
            {validationErrors.length > 3 && (
              <li className="text-red-400">...and {validationErrors.length - 3} more</li>
            )}
          </ul>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="border-slate-600 text-white hover:bg-slate-700 gap-2"
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep 
                  ? 'bg-cyan-400' 
                  : i < currentStep 
                  ? 'bg-emerald-400' 
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {isLastStep ? (
          <Button
            onClick={onComplete}
            disabled={!canProceed || hasErrors || isSubmitting}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white gap-2 min-w-36"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || hasErrors}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white gap-2"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
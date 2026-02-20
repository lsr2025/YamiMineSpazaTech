/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { onboarding_id, task_completed, agent_name } = await req.json();

    // Get onboarding record
    const onboarding = await base44.asServiceRole.entities.Onboarding.get(onboarding_id);
    
    if (!onboarding) {
      return Response.json({ error: 'Onboarding record not found' }, { status: 404 });
    }

    // Send notification to supervisor
    if (onboarding.supervisor_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: onboarding.supervisor_email,
        subject: `Onboarding Progress: ${agent_name}`,
        body: `
          <h2>Onboarding Update</h2>
          <p>${agent_name} has completed: <strong>${task_completed}</strong></p>
          <p>Current progress: ${onboarding.progress_percentage}%</p>
          <p>Status: ${onboarding.status}</p>
          <br>
          <p>View full onboarding details in the HR Dashboard.</p>
        `
      });
    }

    // Notify district coordinator on key milestones (50% and 100%)
    if (onboarding.district_coordinator_email && 
        (onboarding.progress_percentage === 50 || onboarding.progress_percentage === 100)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: onboarding.district_coordinator_email,
        subject: `Onboarding Milestone: ${agent_name} - ${onboarding.progress_percentage}% Complete`,
        body: `
          <h2>Onboarding Milestone Reached</h2>
          <p>${agent_name} has reached ${onboarding.progress_percentage}% completion.</p>
          <p>Latest task: <strong>${task_completed}</strong></p>
          <p>Supervisor: ${onboarding.supervisor_name || 'Unassigned'}</p>
        `
      });
    }

    // If onboarding is completed, send completion notification
    if (onboarding.status === 'completed') {
      // Notify executives and district coordinator
      const executiveEmails = [
        'nokukhanya.kamanga@yamimine.co.za', // COO
        'fundi.madlala@yamimine.co.za'       // CEO
      ];

      const recipients = [...executiveEmails];
      if (onboarding.district_coordinator_email) {
        recipients.push(onboarding.district_coordinator_email);
      }
      if (onboarding.supervisor_email) {
        recipients.push(onboarding.supervisor_email);
      }

      for (const email of recipients) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `✅ Onboarding Completed: ${agent_name}`,
          body: `
            <h2>🎉 Onboarding Successfully Completed</h2>
            <p><strong>${agent_name}</strong> has successfully completed the onboarding process!</p>
            <p>Completion date: ${new Date(onboarding.completion_date).toLocaleDateString()}</p>
            <p>Supervisor: ${onboarding.supervisor_name || 'Unassigned'}</p>
            <p>District Coordinator: ${onboarding.district_coordinator_name || 'Unassigned'}</p>
            <br>
            <p>The new agent is now ready for field assignments.</p>
          `
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Notifications sent successfully' 
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
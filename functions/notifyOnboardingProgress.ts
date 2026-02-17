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

    // If onboarding is completed, send completion notification
    if (onboarding.status === 'completed') {
      // Get all admin users
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin');

      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Onboarding Completed: ${agent_name}`,
          body: `
            <h2>🎉 Onboarding Completed</h2>
            <p>${agent_name} has successfully completed the onboarding process!</p>
            <p>Completion date: ${new Date(onboarding.completion_date).toLocaleDateString()}</p>
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
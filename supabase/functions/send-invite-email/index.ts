import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { targetEmail, inviteLink, orgName, role } = await req.json()

    // Ensure all required fields are present
    if (!targetEmail || !inviteLink || !orgName || !role) {
      throw new Error('Missing required fields (targetEmail, inviteLink, orgName, role)')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured in Edge Function secrets')
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #111; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Organization Invite</h1>
        <p>Hello,</p>
        <p>You have been invited to join <strong>${orgName}</strong> on LeadFlow as a <strong>${role}</strong>.</p>
        <p>Click the button below to accept your invitation and create your account:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px;">
          If you are unable to click the button, copy and paste this link into your browser: <br/>
          <a href="${inviteLink}" style="color: #4f46e5;">${inviteLink}</a>
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'LeadFlow <invites@resend.ajuedsolutions.com>', // Using your newly verified custom domain
        to: [targetEmail],
        subject: `You have been invited to join ${orgName} on LeadFlow`,
        html: htmlContent,
      }),
    })

    const resData = await res.json()
    if (!res.ok) {
      throw new Error(resData.message || 'Failed to send email via Resend')
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error sending invite email:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

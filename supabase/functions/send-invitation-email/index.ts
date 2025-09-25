import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  invitation: {
    id: string;
    token: string;
    role: string;
    expiresAt: string;
  };
  building: {
    id: string;
    name: string;
    address: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { to, subject, html, text, invitation, building, invitedBy }: EmailData = await req.json();

    // Validate required fields
    if (!to || !subject || !html || !text) {
      return new Response(JSON.stringify({
        error: 'Missing required email fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Prepare email data for Resend
    const emailData = {
      from: 'ActivoDigital <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text,
      headers: {
        'X-Invitation-Token': invitation.token,
        'X-Building-Id': building.id,
        'X-Role': invitation.role
      }
    };

    // Send email using Resend API
    console.log('📧 Sending email via Resend API...');
    console.log('📧 Email data:', JSON.stringify(emailData, null, 2));
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    console.log('📧 Resend response status:', resendResponse.status);

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${resendResponse.status} ${errorData}`);
    }

    const resendResult = await resendResponse.json();
    console.log('Email sent successfully:', resendResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      emailId: resendResult.id,
      invitation: {
        email: to,
        role: invitation.role,
        building: building.name,
        expiresAt: invitation.expiresAt
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: 'invitation' | 'welcome' | 'assignment';
  metadata?: {
    invitation?: {
      id: string;
      token: string;
      role: string;
      expiresAt: string;
    };
    building?: {
      id: string;
      name: string;
      address: string;
    };
    invitedBy?: {
      name: string;
      email: string;
    };
    user?: {
      name: string;
      role: string;
      building: string;
    };
  };
}

function generateHeaders(type: string, metadata?: any) {
  const baseHeaders: Record<string, string> = {
    'X-Email-Type': type,
  };

  switch (type) {
    case 'invitation':
      if (metadata?.invitation) {
        baseHeaders['X-Invitation-Token'] = metadata.invitation.token;
        baseHeaders['X-Role'] = metadata.invitation.role;
      }
      if (metadata?.building) {
        baseHeaders['X-Building-Id'] = metadata.building.id;
      }
      break;
    
    case 'welcome':
      if (metadata?.user) {
        baseHeaders['X-Welcome-Email'] = 'true';
        baseHeaders['X-User-Role'] = metadata.user.role;
        baseHeaders['X-Building'] = metadata.user.building;
      }
      break;
    
    case 'assignment':
      if (metadata?.building) {
        baseHeaders['X-Building-Id'] = metadata.building.id;
      }
      if (metadata?.user) {
        baseHeaders['X-User-Role'] = metadata.user.role;
      }
      break;
  }

  return baseHeaders;
}

function getFromAddress(type: string): string {
  switch (type) {
    case 'invitation':
    case 'assignment':
      return 'ActivoDigital <noreply@daioff.com>';
    case 'welcome':
      return 'ActivoDigital <noreply@daioff.com>';
    default:
      return 'ActivoDigital <noreply@daioff.com>';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { to, subject, html, text, type, metadata }: EmailData = await req.json();

    // Validate required fields
    if (!to || !subject || !html || !type) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: to, subject, html, and type are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate email type
    if (!['invitation', 'welcome', 'assignment'].includes(type)) {
      return new Response(JSON.stringify({
        error: 'Invalid email type. Must be: invitation, welcome, or assignment'
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

    // Generate headers based on email type
    const customHeaders = generateHeaders(type, metadata);

    // Prepare email data for Resend
    const emailData = {
      from: getFromAddress(type),
      to: [to],
      subject,
      html,
      text: text || '', // Fallback to empty string if text not provided
      headers: customHeaders
    };

    // Send email using Resend API
    console.log(`📧 Sending ${type} email via Resend API...`);
    console.log(`📧 Email data:`, JSON.stringify(emailData, null, 2));
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    console.log(`📧 Resend response status:`, resendResponse.status);

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${resendResponse.status} ${errorData}`);
    }

    const resendResult = await resendResponse.json();
    console.log(`${type} email sent successfully:`, resendResult);

    // Generate response based on email type
    let responseData: any = {
      success: true,
      message: `${type} email sent successfully`,
      emailId: resendResult.id,
      type
    };

    // Add type-specific data to response
    switch (type) {
      case 'invitation':
        responseData.invitation = {
          email: to,
          role: metadata?.invitation?.role,
          building: metadata?.building?.name,
          expiresAt: metadata?.invitation?.expiresAt
        };
        break;
      
      case 'welcome':
        responseData.user = {
          email: to,
          name: metadata?.user?.name,
          role: metadata?.user?.role,
          building: metadata?.user?.building
        };
        break;
      
      case 'assignment':
        responseData.assignment = {
          email: to,
          building: metadata?.building?.name,
          role: metadata?.user?.role
        };
        break;
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in send-email function:', error);
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

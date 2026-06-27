'use client';

import { useId, useMemo } from 'react';
import Script from 'next/script';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'avatar-image-url'?: string;
          'avatar-orb-color-1'?: string;
          'avatar-orb-color-2'?: string;
          'action-text'?: string;
          'dynamic-variables'?: string;
          'dismissible'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ElevenLabsWidgetProps {
  agentId: string;
  userEmail?: string;
  org?: string;
  activeJobId?: string;
}

export default function ElevenLabsWidget({
  agentId,
  userEmail = '',
  org = '',
  activeJobId = '',
}: ElevenLabsWidgetProps) {
  const sessionId = useId().replace(/:/g, '');

  const dynamicVars = useMemo(() => JSON.stringify({
    user_email: userEmail,
    session_tenant_id: org,
    session_id: sessionId,
    job_id: activeJobId,
    session_agent_id: agentId,
    location_lat: 0,
    location_lng: 0,
  }), [userEmail, org, sessionId, activeJobId, agentId]);

  if (!agentId) return null;

  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
      />
      <elevenlabs-convai
        agent-id={agentId}
        avatar-image-url="/awp-logo.jpg"
        avatar-orb-color-1="#FF6B00"
        avatar-orb-color-2="#FF8C00"
        action-text="Ask AWP AI"
        dismissible="true"
        dynamic-variables={dynamicVars}
      />
    </>
  );
}

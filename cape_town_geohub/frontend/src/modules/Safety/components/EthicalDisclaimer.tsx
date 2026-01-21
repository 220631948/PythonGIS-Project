/**
 * EthicalDisclaimer Component
 * CRITICAL: Prominent warning banner for responsible data use
 */

import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface EthicalDisclaimerProps {
    source?: string;
    className?: string;
}

const EthicalDisclaimer: React.FC<EthicalDisclaimerProps> = ({
    source = 'SAPS Precinct Statistics',
    className = ''
}) => {
    return (
        <div
            className={`
        bg-amber-50 border-l-4 border-amber-500 p-4
        ${className}
      `}
            role="alert"
            aria-label="Ethical data usage disclaimer"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                        Important Ethical Notice
                    </h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        This data displays <strong>historical aggregate patterns only</strong>.
                        It is NOT suitable for predictive policing or individual targeting.
                        Crime statistics reflect reported incidents and may not represent actual crime rates.
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-amber-700">
                            Source: {source}
                        </span>
                        <a
                            href="https://www.saps.gov.za/services/crimestats.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 hover:text-amber-900 underline flex items-center gap-1"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Official Statistics
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EthicalDisclaimer;

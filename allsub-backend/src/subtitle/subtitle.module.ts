import { Module } from '@nestjs/common';
import { SubtitleGateway } from './subtitle.gateway';
import { AudioStreamGateway } from './audio-stream.gateway';
import { SpeechService } from './speech.service';
import { WhisperService } from './whisper.service';
import { TranslationService } from './translation.service';

@Module({
  providers: [
    SubtitleGateway, 
    AudioStreamGateway, 
    SpeechService, 
    WhisperService,
    TranslationService
  ],
  exports: [SpeechService, WhisperService, TranslationService],
})
export class SubtitleModule {}

